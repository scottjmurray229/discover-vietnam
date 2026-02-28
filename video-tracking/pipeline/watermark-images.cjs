#!/usr/bin/env node
/**
 * Batch watermark all existing images in public/images/
 *
 * Uses FFmpeg drawtext to overlay "discoverphilippines.info" on all JPG/PNG images.
 * Skips logo, favicon, and OG default image.
 *
 * Usage:
 *   node video-tracking/pipeline/watermark-images.cjs              # Process all
 *   node video-tracking/pipeline/watermark-images.cjs --dry-run    # Preview only
 *   node video-tracking/pipeline/watermark-images.cjs --force      # Re-watermark all
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const IMAGES_ROOT = path.join(PROJECT_ROOT, 'public', 'images');
const STATE_FILE = path.join(__dirname, 'watermark-images-state.json');
const FONT_PATH = '/Windows/Fonts/arialbd.ttf';

// Files to skip (logos, favicons, OG images)
const SKIP_FILES = new Set([
  'logo.png',
  'favicon.svg',
  'favicon.ico',
  'og-default.jpg',
]);

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// Find FFmpeg
let FFMPEG = 'ffmpeg';
try {
  execSync('ffmpeg -version', { stdio: 'pipe' });
} catch {
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
        }
      }
    }
  }
  if (FFMPEG === 'ffmpeg') {
    console.error('Error: FFmpeg not found. Install with: winget install ffmpeg');
    process.exit(1);
  }
}

// Find ffprobe alongside ffmpeg
let FFPROBE = 'ffprobe';
if (FFMPEG !== 'ffmpeg') {
  FFPROBE = FFMPEG.replace('ffmpeg.exe', 'ffprobe.exe');
}

// Load state
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { watermarked: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Get image height for proportional font sizing
function getImageHeight(filePath) {
  try {
    const cmd = `"${FFPROBE}" -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "${filePath}"`;
    const output = execSync(cmd, { stdio: 'pipe' }).toString().trim();
    return parseInt(output, 10) || 600;
  } catch {
    return 600;
  }
}

// Watermark drawtext filter
function watermarkFilter(fontsize) {
  return `drawtext=text='discoverphilippines.info':fontsize=${fontsize}:fontcolor=white@0.8:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=w-tw-20:y=h-th-20:fontfile='${FONT_PATH}'`;
}

// Recursively find all image files
function findImages(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findImages(fullPath));
    } else if (entry.isFile()) {
      const ext = entry.name.toLowerCase();
      if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp')) {
        // Skip excluded files
        if (SKIP_FILES.has(entry.name)) continue;

        const relPath = path.relative(IMAGES_ROOT, fullPath).replace(/\\/g, '/');
        files.push({ fullPath, relPath, filename: entry.name });
      }
    }
  }

  return files;
}

// Process a single image
function processImage(image, state) {
  const { fullPath, relPath, filename } = image;
  const fileKey = relPath;

  // Skip if already watermarked (unless --force)
  if (!force && state.watermarked[fileKey]) {
    return { status: 'skipped', reason: 'already watermarked' };
  }

  // Proportional font size (~3% of height)
  const height = getImageHeight(fullPath);
  const fontsize = Math.max(16, Math.round(height * 0.03));

  const origSize = fs.statSync(fullPath).size;
  const ext = path.extname(filename).toLowerCase();
  const tempPath = fullPath + '.tmp' + ext;

  // Build FFmpeg command — use -q:v 2 for JPEG quality, PNG stays lossless
  const qualityArgs = ext === '.png' ? [] : ['-q:v', '2'];

  const cmd = [
    `"${FFMPEG}"`, '-y',
    '-i', `"${fullPath}"`,
    '-vf', `${watermarkFilter(fontsize)}`,
    ...qualityArgs,
    `"${tempPath}"`,
  ].join(' ');

  if (dryRun) {
    return { status: 'dry_run', fontsize, height };
  }

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 60000 });
    const newSize = fs.statSync(tempPath).size;

    // Replace original
    fs.unlinkSync(fullPath);
    fs.renameSync(tempPath, fullPath);

    state.watermarked[fileKey] = {
      timestamp: new Date().toISOString(),
      origSize,
      newSize,
    };

    return { status: 'processed', origSize, newSize };
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return { status: 'error', error: err.message.slice(0, 200) };
  }
}

// Format bytes
function formatSize(bytes) {
  return (bytes / 1024).toFixed(0) + ' KB';
}

// Main
function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   BATCH IMAGE WATERMARK — DISCOVER PHILIPPINES          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const state = loadState();
  const images = findImages(IMAGES_ROOT);

  console.log(`Total images found: ${images.length}`);
  console.log(`Skipped files: ${Array.from(SKIP_FILES).join(', ')}`);
  if (dryRun) console.log('DRY RUN — no actual processing');
  if (force) console.log('FORCE — re-watermarking all files');
  console.log();

  if (images.length === 0) {
    console.log('No images to process.');
    return;
  }

  const toProcess = force ? images : images.filter(i => !state.watermarked[i.relPath]);
  console.log(`Images to watermark: ${toProcess.length} (${images.length - toProcess.length} already done)\n`);

  const stats = { processed: 0, skipped: 0, errors: 0 };
  const startTime = Date.now();

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const progress = `[${i + 1}/${images.length}]`;

    const result = processImage(image, state);

    if (result.status === 'processed') {
      console.log(`  ${progress} ✅ ${image.relPath} (${formatSize(result.origSize)} → ${formatSize(result.newSize)})`);
      stats.processed++;
    } else if (result.status === 'skipped') {
      console.log(`  ${progress} ⏭️  ${image.relPath} (${result.reason})`);
      stats.skipped++;
    } else if (result.status === 'dry_run') {
      console.log(`  ${progress} [DRY RUN] ${image.relPath} (height=${result.height}px, fontsize=${result.fontsize})`);
    } else {
      console.log(`  ${progress} ❌ ${image.relPath}: ${result.error}`);
      stats.errors++;
    }
  }

  if (!dryRun) saveState(state);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  IMAGE WATERMARK BATCH COMPLETE');
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Skipped:   ${stats.skipped}`);
  console.log(`  Errors:    ${stats.errors}`);
  console.log(`  Time:      ${elapsed}s`);
  console.log(`${'═'.repeat(60)}\n`);
}

main();
