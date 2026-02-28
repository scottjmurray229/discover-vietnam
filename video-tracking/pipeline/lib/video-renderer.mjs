/**
 * Renders destination YouTube Shorts using Remotion.
 * Bundles once, renders per-destination with inputProps.
 * Starts a local HTTP file server so Remotion can access video/audio assets.
 * Output: MP4 files in youtube/edited/
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const REMOTION_DIR = path.join(__dirname, '..', '..', 'remotion');
const ENTRY_POINT = path.join(REMOTION_DIR, 'index.ts');

let bundleLocation = null;
let fileServer = null;
let fileServerPort = 0;

/**
 * Start a simple HTTP file server for the project root.
 * Remotion needs HTTP URLs for video/audio assets.
 */
function startFileServer() {
  return new Promise((resolve) => {
    const MIME = { '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
    fileServer = http.createServer((req, res) => {
      const filePath = path.join(PROJECT_ROOT, decodeURIComponent(req.url));
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(filePath).toLowerCase();
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    });
    fileServer.listen(0, '127.0.0.1', () => {
      fileServerPort = fileServer.address().port;
      console.log(`  📡 Asset server on port ${fileServerPort}`);
      resolve();
    });
  });
}

/**
 * Stop the file server (call when done rendering)
 */
export function stopFileServer() {
  if (fileServer) {
    fileServer.close();
    fileServer = null;
  }
}

/**
 * Bundle the Remotion project (call once before rendering)
 * @returns {Promise<string>} Bundle URL
 */
export async function bundleProject() {
  if (bundleLocation) return bundleLocation;

  // Start file server for video/audio assets
  await startFileServer();

  console.log('  📦 Bundling Remotion project...');
  bundleLocation = await bundle({
    entryPoint: ENTRY_POINT,
    onProgress: (progress) => {
      if (progress % 25 === 0) {
        process.stdout.write(`  📦 Bundle progress: ${progress}%\r`);
      }
    },
  });
  console.log('  ✅ Remotion bundle ready');
  return bundleLocation;
}

/**
 * Render a single destination Short
 * @param {object} dest - Destination data from destination-loader
 * @param {object} options
 * @param {string} options.videoSrc - Path to background video (youtube/raw/)
 * @param {string} [options.audioSrc] - Path to narration audio (youtube/audio/)
 * @param {string} options.outputDir - Directory for rendered videos (youtube/edited/)
 * @param {boolean} [options.force=false] - Re-render even if cached
 * @param {string} [options.proTip] - Scott's Pro Tip text
 * @returns {Promise<string>} Path to rendered video
 */
export async function renderDestination(dest, options) {
  const year = new Date().getFullYear();
  const outputPath = path.join(options.outputDir, `short-${dest.slug}-${year}.mp4`);

  // Check cache
  if (!options.force && fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Video cached: ${dest.slug}`);
    return outputPath;
  }

  fs.mkdirSync(options.outputDir, { recursive: true });

  if (!bundleLocation) {
    await bundleProject();
  }

  // Convert absolute paths to HTTP URLs served by our file server
  const toUrl = (absPath) => {
    const rel = path.relative(PROJECT_ROOT, absPath).replace(/\\/g, '/');
    return `http://127.0.0.1:${fileServerPort}/${rel}`;
  };

  const inputProps = {
    slug: dest.slug,
    title: dest.title,
    tagline: dest.tagline || '',
    region: dest.region || 'Philippines',
    bestMonths: dest.bestMonths || [],
    budgetPerDay: dest.budgetPerDay || { backpacker: 30, midRange: 80, luxury: 200 },
    highlights: (dest.highlights || []).slice(0, 3),
    proTip: options.proTip || `Book your ${dest.title} accommodation early during peak season.`,
    videoSrc: options.videoSrc ? toUrl(options.videoSrc) : '',
    audioSrc: options.audioSrc ? toUrl(options.audioSrc) : undefined,
  };

  console.log(`  🎬 Rendering Short for ${dest.slug}...`);

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'DestinationVideo',
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0) {
        process.stdout.write(`  🎬 Render progress: ${Math.round(progress * 100)}%\r`);
      }
    },
  });

  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`  ✅ Short rendered: ${dest.slug} (${sizeMB} MB)`);

  return outputPath;
}
