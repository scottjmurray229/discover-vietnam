#!/usr/bin/env node
/**
 * Batch watermark all existing videos in public/videos/
 *
 * Re-encodes each .mp4 with a "discoverphilippines.info" drawtext overlay
 * in the bottom-right corner. Writes to a temp file, then replaces the original.
 *
 * Usage:
 *   node video-tracking/pipeline/watermark-videos.cjs                  # Process all
 *   node video-tracking/pipeline/watermark-videos.cjs --dest boracay   # Single destination
 *   node video-tracking/pipeline/watermark-videos.cjs --dry-run        # Preview only
 *   node video-tracking/pipeline/watermark-videos.cjs --dir pillar     # Only pillar/ subdir
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const VIDEOS_ROOT = path.join(PROJECT_ROOT, 'public', 'videos');
const STATE_FILE = path.join(__dirname, 'watermark-videos-state.json');
const FONT_PATH = '/Windows/Fonts/arialbd.ttf';

// Parse CLI args
const args = process.argv.slice(2);
const destFilter = args.includes('--dest') ? args[args.indexOf('--dest') + 1] : null;
const dirFilter = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null;
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

// Load state (tracks which files have been watermarked)
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { watermarked: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Get video resolution
function getResolution(filePath) {
  try {
    const cmd = `"${FFPROBE}" -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "${filePath}"`;
    const output = execSync(cmd, { stdio: 'pipe' }).toString().trim();
    return parseInt(output, 10) || 1080;
  } catch {
    return 1080; // default
  }
}

// Watermark drawtext filter
function watermarkFilter(fontsize) {
  return `drawtext=text='discoverphilippines.info':fontsize=${fontsize}:fontcolor=white@0.8:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=w-tw-20:y=h-th-20:fontfile='${FONT_PATH}'`;
}

// Find all mp4 files
function findVideos() {
  const files = [];
  const subdirs = ['destinations', 'pillar', 'blog'];

  for (const subdir of subdirs) {
    if (dirFilter && subdir !== dirFilter) continue;
    const dirPath = path.join(VIDEOS_ROOT, subdir);
    if (!fs.existsSync(dirPath)) continue;

    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith('.mp4')) continue;

      // Filter by destination slug
      if (destFilter) {
        const slug = file.replace(/-(?:hero|break-\d+|preview|card-\d+)\.mp4$/, '');
        if (slug !== destFilter) continue;
      }

      files.push({
        fullPath: path.join(dirPath, file),
        relPath: path.join(subdir, file),
        filename: file,
        subdir,
      });
    }
  }

  return files;
}

// Process a single video
function processVideo(video, state) {
  const { fullPath, relPath, filename } = video;
  const fileKey = relPath.replace(/\\/g, '/');

  // Skip if already watermarked (unless --force)
  if (!force && state.watermarked[fileKey]) {
    return { status: 'skipped', reason: 'already watermarked' };
  }

  // Determine font size based on resolution
  const height = getResolution(fullPath);
  const fontsize = height >= 1080 ? 32 : height >= 720 ? 22 : 18;

  // Get original file stats for CRF estimation
  const origSize = fs.statSync(fullPath).size;
  const isPreview = filename.includes('-preview');
  const crf = isPreview ? 26 : filename.includes('-hero') ? 24 : 25;

  const tempPath = fullPath + '.tmp.mp4';

  const cmd = [
    `"${FFMPEG}"`, '-y',
    '-i', `"${fullPath}"`,
    '-vf', `${watermarkFilter(fontsize)}`,
    '-c:v', 'libx264',
    '-crf', crf,
    '-preset', 'medium',
    '-an',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    `"${tempPath}"`,
  ].join(' ');

  if (dryRun) {
    return { status: 'dry_run', fontsize, crf };
  }

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 300000 }); // 5 min timeout per file
    const newSize = fs.statSync(tempPath).size;

    // Replace original with watermarked version
    fs.unlinkSync(fullPath);
    fs.renameSync(tempPath, fullPath);

    // Track in state
    state.watermarked[fileKey] = {
      timestamp: new Date().toISOString(),
      origSize,
      newSize,
    };

    return { status: 'processed', origSize, newSize };
  } catch (err) {
    // Clean up temp file on error
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return { status: 'error', error: err.message.slice(0, 200) };
  }
}

// Format bytes
function formatSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// Main
function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   BATCH VIDEO WATERMARK — DISCOVER PHILIPPINES          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const state = loadState();
  const videos = findVideos();

  console.log(`Total videos found: ${videos.length}`);
  if (destFilter) console.log(`Filtering: destination = ${destFilter}`);
  if (dirFilter) console.log(`Filtering: directory = ${dirFilter}`);
  if (dryRun) console.log('DRY RUN — no actual processing');
  if (force) console.log('FORCE — re-watermarking all files');
  console.log();

  if (videos.length === 0) {
    console.log('No videos to process.');
    return;
  }

  // Count how many will actually be processed
  const toProcess = force ? videos : videos.filter(v => !state.watermarked[v.relPath.replace(/\\/g, '/')]);
  console.log(`Videos to watermark: ${toProcess.length} (${videos.length - toProcess.length} already done)\n`);

  const stats = { processed: 0, skipped: 0, errors: 0 };
  const startTime = Date.now();

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const progress = `[${i + 1}/${videos.length}]`;

    const result = processVideo(video, state);

    if (result.status === 'processed') {
      const pct = ((result.newSize / result.origSize) * 100).toFixed(0);
      console.log(`  ${progress} ✅ ${video.relPath} (${formatSize(result.origSize)} → ${formatSize(result.newSize)}, ${pct}%)`);
      stats.processed++;

      // Save state periodically (every 10 files)
      if (stats.processed % 10 === 0) saveState(state);

      // ETA calculation
      const elapsed = (Date.now() - startTime) / 1000;
      const avgPerFile = elapsed / stats.processed;
      const remaining = toProcess.length - stats.processed;
      if (remaining > 0) {
        const eta = Math.ceil(avgPerFile * remaining / 60);
        console.log(`         ETA: ~${eta} min remaining`);
      }
    } else if (result.status === 'skipped') {
      console.log(`  ${progress} ⏭️  ${video.relPath} (${result.reason})`);
      stats.skipped++;
    } else if (result.status === 'dry_run') {
      console.log(`  ${progress} [DRY RUN] ${video.relPath} (fontsize=${result.fontsize}, crf=${result.crf})`);
    } else {
      console.log(`  ${progress} ❌ ${video.relPath}: ${result.error}`);
      stats.errors++;
    }
  }

  // Final state save
  if (!dryRun) saveState(state);

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  WATERMARK BATCH COMPLETE');
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Skipped:   ${stats.skipped}`);
  console.log(`  Errors:    ${stats.errors}`);
  console.log(`  Time:      ${elapsed} min`);
  console.log(`${'═'.repeat(60)}\n`);
}

main();
