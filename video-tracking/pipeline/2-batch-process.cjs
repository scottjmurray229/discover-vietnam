#!/usr/bin/env node
/**
 * STEP 2: Batch process downloaded videos with FFmpeg
 *
 * Reads raw-downloads/, compresses for web, outputs to public/videos/destinations/
 * Also generates preview clips for the destination index cards.
 *
 * Usage:
 *   node video-tracking/pipeline/2-batch-process.cjs                  # Process all
 *   node video-tracking/pipeline/2-batch-process.cjs --dest boracay   # Single destination
 *   node video-tracking/pipeline/2-batch-process.cjs --heroes-only    # Heroes only
 *   node video-tracking/pipeline/2-batch-process.cjs --dry-run        # Show what would happen
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const { loadConfig } = require('./config-loader.cjs');

const config = loadConfig();

// Parse CLI args
const args = process.argv.slice(2);
const destFilter = args.includes('--dest') ? args[args.indexOf('--dest') + 1] : null;
const heroesOnly = args.includes('--heroes-only');
const dryRun = args.includes('--dry-run');

// Find FFmpeg — check PATH first, then common WinGet install location
let FFMPEG = 'ffmpeg';
try {
  execSync('ffmpeg -version', { stdio: 'pipe' });
} catch {
  // Check WinGet install path (Windows)
  const wingetBase = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetBase)) {
    const pkg = fs.readdirSync(wingetBase).find(d => d.startsWith('Gyan.FFmpeg'));
    if (pkg) {
      const pkgDir = path.join(wingetBase, pkg);
      const builds = fs.readdirSync(pkgDir).filter(d => d.includes('full_build'));
      if (builds.length > 0) {
        const candidate = path.join(pkgDir, builds[0], 'bin', 'ffmpeg.exe');
        if (fs.existsSync(candidate)) {
          FFMPEG = candidate;
          console.log(`  FFmpeg found at WinGet path: ${FFMPEG}\n`);
        }
      }
    }
  }
  if (FFMPEG === 'ffmpeg') {
    console.error('Error: FFmpeg not found. Install it first:');
    console.error('  winget install ffmpeg');
    console.error('  or download from https://ffmpeg.org/download.html');
    process.exit(1);
  }
}

// Ensure output directories exist
fs.mkdirSync(config.PUBLIC_VIDEOS, { recursive: true });

// Watermark drawtext filter — appended to -vf chain
const FONT_PATH = '/Windows/Fonts/arialbd.ttf';
function watermarkFilter(fontsize) {
  const text = config.WATERMARK_TEXT || 'discoverflorida.info';
  return `drawtext=text='${text}':fontsize=${fontsize}:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=10:x=w-tw-30:y=h-th-20:fontfile='${FONT_PATH}'`;
}

// Video processing profiles
const PROFILES = {
  hero: {
    width: 1920,
    height: 1080,
    crf: 24,
    duration: 18,
    fps: 24,
    watermarkSize: 32,
    description: 'Hero (1080p, 18s, web-optimized)',
  },
  immersive_break: {
    width: 1920,
    height: 1080,
    crf: 25,
    duration: 12,
    fps: 24,
    watermarkSize: 32,
    description: 'Immersive break (1080p, 12s, web-optimized)',
  },
  thumbnail: {
    width: 1280,
    height: 720,
    crf: 26,
    duration: 8,
    fps: 24,
    watermarkSize: 22,
    description: 'Preview/thumbnail (720p, 8s, web-optimized)',
  },
};

// Scan raw-downloads for unprocessed files
function findRawFiles() {
  const files = [];
  const dirs = ['heroes', 'breaks', 'thumbnails'];
  const exts = ['.mp4', '.mov', '.webm'];

  for (const dir of dirs) {
    const dirPath = path.join(config.RAW_DOWNLOADS, dir);
    if (!fs.existsSync(dirPath)) continue;

    for (const file of fs.readdirSync(dirPath)) {
      if (!exts.includes(path.extname(file).toLowerCase())) continue;
      files.push({
        rawPath: path.join(dirPath, file),
        filename: file,
        dir,
        slot: dir === 'heroes' ? 'hero' : dir === 'thumbnails' ? 'thumbnail' : 'immersive_break',
      });
    }
  }

  return files;
}

// Determine output path for a file
// Heroes always use their filename (already named {dest}-hero.mp4)
// Breaks always output as {dest}-break-N.mp4 regardless of input name
function getOutputPath(file, outputName) {
  return path.join(config.PUBLIC_VIDEOS, outputName || file.filename);
}

// Get preview output path (hero files also generate a preview)
function getPreviewPath(dest) {
  return path.join(config.PUBLIC_VIDEOS, `${dest}-preview.mp4`);
}

// Count existing breaks for a dest already in public/videos/
function countExistingWebBreaks(dest) {
  if (!fs.existsSync(config.PUBLIC_VIDEOS)) return 0;
  return fs.readdirSync(config.PUBLIC_VIDEOS)
    .filter(f => f.startsWith(`${dest}-break-`) && /\d+\.mp4$/.test(f)).length;
}

// Load known destination slugs from content dir
function loadKnownDests() {
  const contentDir = path.join(config.PROJECT_ROOT, 'src', 'content', 'destinations');
  if (!fs.existsSync(contentDir)) return [];
  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
    .sort((a, b) => b.length - a.length); // longest first for greedy match
}

// Detect destination slug from filename — tries multiple strategies
function detectDest(filename, knownDests) {
  // 1. Standard pattern: {dest}-hero.mp4 or {dest}-break-N.mp4
  const patternMatch = filename.match(/^(.+?)-(hero|break-|preview)/);
  if (patternMatch) {
    const candidate = patternMatch[1];
    if (knownDests.includes(candidate)) return candidate;
  }
  // 2. Check if filename starts with a known dest slug
  for (const dest of knownDests) {
    if (filename.toLowerCase().startsWith(dest + '-') || filename.toLowerCase().startsWith(dest + ' ')) {
      return dest;
    }
  }
  // 3. Check if dest slug appears anywhere in filename
  for (const dest of knownDests) {
    if (filename.toLowerCase().includes(dest.replace(/-/g, ' ')) || filename.toLowerCase().includes(dest.replace(/-/g, '-'))) {
      return dest;
    }
  }
  return null;
}

// Get destination slug from filename
function getDestSlug(filename) {
  // "boracay-hero.mp4" → "boracay"
  // "boracay-break-arrival.mp4" → "boracay"
  return filename.split('-')[0];
  // Handle multi-part slugs like "mt-pulag", "el-nido", "puerto-princesa", "la-union", "puerto-galera"
}

function getDestSlugFull(filename) {
  // Better slug extraction: everything before -hero or -break- or -preview
  const match = filename.match(/^(.+?)-(hero|break-|preview)/);
  return match ? match[1] : filename.replace('.mp4', '');
}

// Process a single file — outputName is the final filename in public/videos/destinations/
function processFile(file, profile, outputName) {
  const outputPath = getOutputPath(file, outputName);
  const { width, height, crf, duration, fps } = profile;

  // Skip if already processed
  if (fs.existsSync(outputPath)) {
    const rawStat = fs.statSync(file.rawPath);
    const outStat = fs.statSync(outputPath);
    if (outStat.mtimeMs > rawStat.mtimeMs) {
      return { status: 'skipped', reason: 'already processed', outputPath };
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const cmd = [
    `"${FFMPEG}"`, '-y',
    '-i', `"${file.rawPath}"`,
    '-t', duration,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,${watermarkFilter(profile.watermarkSize)}`,
    '-c:v', 'libx264',
    '-crf', crf,
    '-preset', 'medium',
    '-r', fps,
    '-an',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    `"${outputPath}"`,
  ].join(' ');

  if (dryRun) {
    return { status: 'dry_run', cmd, outputPath };
  }

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    const outSize = fs.statSync(outputPath).size;
    return { status: 'processed', size: outSize, outputPath };
  } catch (err) {
    return { status: 'error', error: err.message.slice(0, 200), outputPath };
  }
}

// Generate preview clip from hero raw file
function generatePreview(file, dest) {
  const previewPath = getPreviewPath(dest);

  if (fs.existsSync(previewPath)) {
    return { status: 'skipped', reason: 'preview exists', outputPath: previewPath };
  }

  fs.mkdirSync(path.dirname(previewPath), { recursive: true });

  const cmd = [
    `"${FFMPEG}"`, '-y',
    '-i', `"${file.rawPath}"`,
    '-t', 8,
    '-vf', `scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,${watermarkFilter(22)}`,
    '-c:v', 'libx264',
    '-crf', 26,
    '-preset', 'medium',
    '-r', 24,
    '-an',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    `"${previewPath}"`,
  ].join(' ');

  if (dryRun) {
    return { status: 'dry_run', cmd, outputPath: previewPath };
  }

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    const outSize = fs.statSync(previewPath).size;
    return { status: 'processed', size: outSize, outputPath: previewPath };
  } catch (err) {
    return { status: 'error', error: err.message.slice(0, 200), outputPath: previewPath };
  }
}

// Main
function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║   BATCH VIDEO PROCESSOR — ${(config.WATERMARK_TEXT || 'DISCOVER').toUpperCase().padEnd(29)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  let files = findRawFiles();

  if (destFilter) {
    files = files.filter(f => {
      const slug = getDestSlugFull(f.filename);
      // Also catch Storyblocks breaks whose filenames start with the dest slug
      return slug === destFilter || f.filename.startsWith(destFilter + '-');
    });
  }
  if (heroesOnly) {
    files = files.filter(f => f.slot === 'hero');
  }

  console.log(`Raw files found: ${files.length}`);
  if (destFilter) console.log(`Filtering: destination = ${destFilter}`);
  if (heroesOnly) console.log(`Filtering: heroes only`);
  if (dryRun) console.log('DRY RUN — no actual processing');
  console.log();

  if (files.length === 0) {
    console.log('No files to process. Download clips first with Step 1.');
    return;
  }

  const stats = { processed: 0, skipped: 0, errors: 0, previews: 0 };
  const processedFiles = [];
  const knownDests = loadKnownDests();

  // Assign output names — heroes keep their name, breaks get {dest}-break-N.mp4
  // Track break counters per dest (starting after existing files in public/videos/)
  const breakCounters = {};

  const filesWithOutputNames = files.map(file => {
    if (file.slot === 'hero' || file.slot === 'thumbnail') {
      // Heroes already named correctly: {dest}-hero.mp4
      const outputName = file.filename.replace(/\.(mov|webm|avi|mkv)$/i, '.mp4');
      return { ...file, outputName };
    }
    // Break — determine dest and assign number
    const dest = destFilter || detectDest(file.filename, knownDests) || 'unknown';
    if (!breakCounters[dest]) {
      breakCounters[dest] = countExistingWebBreaks(dest);
    }
    breakCounters[dest]++;
    const outputName = `${dest}-break-${breakCounters[dest]}.mp4`;
    return { ...file, outputName, dest };
  });

  for (const file of filesWithOutputNames) {
    const profile = PROFILES[file.slot] || PROFILES.immersive_break;
    console.log(`  Processing: ${file.filename} → ${file.outputName} (${profile.description})`);

    const result = processFile(file, profile, file.outputName);

    if (result.status === 'processed') {
      const mb = (result.size / 1024 / 1024).toFixed(1);
      console.log(`    ✅ ${mb} MB → ${file.outputName}`);
      stats.processed++;
      processedFiles.push({ file, outputPath: result.outputPath });
    } else if (result.status === 'skipped') {
      console.log(`    ⏭️  ${result.reason}`);
      stats.skipped++;
    } else if (result.status === 'dry_run') {
      console.log(`    [DRY RUN] ${result.cmd.slice(0, 100)}...`);
    } else {
      console.log(`    ❌ Error: ${result.error}`);
      stats.errors++;
    }

    // Generate preview for heroes
    if (file.slot === 'hero') {
      const dest = file.outputName.replace('-hero.mp4', '');
      const previewResult = generatePreview(file, dest);
      if (previewResult) {
        if (previewResult.status === 'processed') {
          const mb = (previewResult.size / 1024 / 1024).toFixed(1);
          console.log(`    ✅ Preview: ${mb} MB → ${dest}-preview.mp4`);
          stats.previews++;
        } else if (previewResult.status === 'skipped') {
          console.log(`    ⏭️  Preview: ${previewResult.reason}`);
        }
      }
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  BATCH PROCESSING COMPLETE');
  console.log(`  Processed: ${stats.processed} clips`);
  console.log(`  Previews generated: ${stats.previews}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);

  if (processedFiles.length > 0) {
    console.log('\n  Next step: Run Step 3 to update frontmatter and deploy');
    console.log('  node video-tracking/pipeline/3-deploy-videos.cjs');
  }
  console.log(`${'═'.repeat(60)}\n`);
}

main();
