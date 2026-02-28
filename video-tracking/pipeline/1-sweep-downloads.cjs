#!/usr/bin/env node
/**
 * STEP 1: Sweep ~/Downloads/ for new video clips, rename & organize
 *
 * No API calls. User manually downloads clips from Shutterstock/Storyblocks,
 * then runs this script to sweep, rename, and organize into the pipeline.
 *
 * Usage:
 *   node video-tracking/pipeline/1-sweep-downloads.cjs                    # Interactive — scan & assign
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --dest miami       # Assign all clips to one destination
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --hours 2          # Only files from last 2 hours
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --dry-run          # Preview without moving
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --keep-originals   # Don't delete from Downloads
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yaml = require('js-yaml');
const { loadConfig } = require('./config-loader.cjs');

const config = loadConfig();

// Parse CLI args
const args = process.argv.slice(2);
const destFilter = args.includes('--dest') ? args[args.indexOf('--dest') + 1] : null;
const hoursBack = args.includes('--hours') ? parseFloat(args[args.indexOf('--hours') + 1]) : 24;
const dryRun = args.includes('--dry-run');
const keepOriginals = args.includes('--keep-originals');

const DOWNLOADS_DIR = path.join(require('os').homedir(), 'Downloads');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

// Load known destinations from content directory
function loadDestinations() {
  const contentDir = path.join(config.PROJECT_ROOT, 'src', 'content', 'destinations');
  if (!fs.existsSync(contentDir)) return [];
  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
    .sort();
}

// Find video files in ~/Downloads/
function findNewClips() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.error(`Downloads folder not found: ${DOWNLOADS_DIR}`);
    process.exit(1);
  }

  const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
  const extensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

  return fs.readdirSync(DOWNLOADS_DIR)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      if (!extensions.includes(ext)) return false;
      const stat = fs.statSync(path.join(DOWNLOADS_DIR, f));
      return stat.mtimeMs >= cutoff;
    })
    .map(f => {
      const stat = fs.statSync(path.join(DOWNLOADS_DIR, f));
      return {
        filename: f,
        fullPath: path.join(DOWNLOADS_DIR, f),
        sizeMB: (stat.size / 1024 / 1024).toFixed(1),
        modified: stat.mtime,
      };
    })
    .sort((a, b) => b.modified - a.modified);
}

// Try to auto-detect destination from filename
function guessDestination(filename, knownDests) {
  const lower = filename.toLowerCase().replace(/[-_\.]/g, ' ');
  for (const dest of knownDests) {
    const destWords = dest.replace(/-/g, ' ');
    if (lower.includes(destWords) || lower.includes(dest)) {
      return dest;
    }
  }
  return null;
}

// Guess clip type from filename
function guessType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('hero') || lower.includes('aerial') || lower.includes('drone')) return 'hero';
  if (lower.includes('preview') || lower.includes('thumb') || lower.includes('card')) return 'preview';
  return 'break';
}

function getOutputDir(clipType) {
  if (clipType === 'hero') return path.join(config.RAW_DOWNLOADS, 'heroes');
  if (clipType === 'preview') return path.join(config.RAW_DOWNLOADS, 'thumbnails');
  return path.join(config.RAW_DOWNLOADS, 'breaks');
}

function getOutputFilename(dest, clipType, descriptor) {
  if (clipType === 'hero') return `${dest}-hero.mp4`;
  if (clipType === 'preview') return `${dest}-preview.mp4`;
  return descriptor ? `${dest}-break-${descriptor}.mp4` : `${dest}-break-1.mp4`;
}

// Count existing breaks for a destination to auto-number
function countExistingBreaks(dest) {
  const breaksDir = path.join(config.RAW_DOWNLOADS, 'breaks');
  if (!fs.existsSync(breaksDir)) return 0;
  return fs.readdirSync(breaksDir)
    .filter(f => f.startsWith(`${dest}-break-`)).length;
}

// Main
async function main() {
  const siteName = config.WATERMARK_TEXT || path.basename(config.PROJECT_ROOT);

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║   SWEEP DOWNLOADS — ${siteName.toUpperCase().padEnd(35)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const knownDests = loadDestinations();
  console.log(`  Site destinations: ${knownDests.length}`);
  console.log(`  Scanning: ${DOWNLOADS_DIR}`);
  console.log(`  Looking back: ${hoursBack} hours`);
  if (destFilter) console.log(`  Auto-assign to: ${destFilter}`);
  if (dryRun) console.log('  Mode: DRY RUN');
  if (keepOriginals) console.log('  Keeping originals in Downloads');
  console.log();

  const clips = findNewClips();

  if (clips.length === 0) {
    console.log('  No new video files found in Downloads.');
    console.log(`  (Checked for files modified in the last ${hoursBack} hours)`);
    console.log('  Tip: Use --hours 48 to look further back.');
    rl.close();
    return;
  }

  console.log(`  Found ${clips.length} video file(s):\n`);
  clips.forEach((c, i) => {
    const age = ((Date.now() - c.modified.getTime()) / 3600000).toFixed(1);
    console.log(`    [${i + 1}] ${c.filename}  (${c.sizeMB} MB, ${age}h ago)`);
  });
  console.log();

  // Show known destinations for reference
  if (!destFilter && knownDests.length > 0) {
    console.log('  Known destinations:');
    const cols = 4;
    for (let i = 0; i < knownDests.length; i += cols) {
      const row = knownDests.slice(i, i + cols).map(d => d.padEnd(25)).join('');
      console.log(`    ${row}`);
    }
    console.log();
  }

  // Process each clip
  const results = { moved: 0, skipped: 0 };
  const inventory = loadInventory();

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  [${i + 1}/${clips.length}] ${clip.filename}  (${clip.sizeMB} MB)`);
    console.log(`${'─'.repeat(60)}`);

    // Determine destination
    let dest = destFilter;
    if (!dest) {
      const guess = guessDestination(clip.filename, knownDests);
      if (guess) {
        const confirm = await ask(`  Auto-detected destination: ${guess}. Correct? (y/n/other slug): `);
        if (confirm === 'y' || confirm === 'Y' || confirm === '') {
          dest = guess;
        } else if (confirm === 'n' || confirm === 'N') {
          dest = await ask('  Enter destination slug: ');
        } else if (confirm === 'skip' || confirm === 's') {
          console.log('  Skipped.');
          results.skipped++;
          continue;
        } else {
          dest = confirm.trim();
        }
      } else {
        dest = await ask('  Destination slug (or "skip"): ');
      }
    }

    dest = dest.trim().toLowerCase();
    if (dest === 'skip' || dest === 's' || !dest) {
      console.log('  Skipped.');
      results.skipped++;
      continue;
    }

    // Determine clip type
    const guessedType = guessType(clip.filename);
    const typeInput = await ask(`  Type? [h]ero / [b]reak / [p]review (default: ${guessedType[0]}): `);
    let clipType;
    if (!typeInput || typeInput === guessedType[0]) {
      clipType = guessedType;
    } else if (typeInput === 'h' || typeInput === 'hero') {
      clipType = 'hero';
    } else if (typeInput === 'p' || typeInput === 'preview') {
      clipType = 'preview';
    } else {
      clipType = 'break';
    }

    // For breaks, get descriptor
    let descriptor = '';
    if (clipType === 'break') {
      const existingCount = countExistingBreaks(dest);
      const defaultNum = existingCount + 1;
      descriptor = await ask(`  Break descriptor (e.g., "sunset", "beach") or enter for auto-number [${defaultNum}]: `);
      if (!descriptor.trim()) {
        descriptor = String(defaultNum);
      }
      descriptor = descriptor.trim().toLowerCase().replace(/\s+/g, '-');
    }

    // Build paths
    const outputDir = getOutputDir(clipType);
    const outputFilename = getOutputFilename(dest, clipType, descriptor);
    const outputPath = path.join(outputDir, outputFilename);
    const ytDir = config.YOUTUBE_RAW;
    const ytFilename = outputFilename.replace('.mp4', '-full.mp4');
    const ytPath = path.join(ytDir, ytFilename);

    console.log(`\n  → ${path.relative(config.PROJECT_ROOT, outputPath)}`);
    console.log(`  → youtube/raw/${ytFilename}`);

    if (dryRun) {
      console.log('  [DRY RUN] Would move file.');
      results.moved++;
      continue;
    }

    // Create directories
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(ytDir, { recursive: true });

    // Copy to youtube/raw (full quality backup)
    fs.copyFileSync(clip.fullPath, ytPath);
    console.log(`  Copied to youtube/raw/`);

    // Move to raw-downloads (for pipeline processing)
    fs.copyFileSync(clip.fullPath, outputPath);
    console.log(`  Copied to raw-downloads/`);

    // Remove original from Downloads (avoid duplicate large files)
    if (!keepOriginals) {
      fs.unlinkSync(clip.fullPath);
      console.log(`  Removed from Downloads`);
    }

    // Update inventory if it exists
    if (inventory) {
      const entryId = `${dest}-${clipType === 'break' ? `break-${descriptor}` : clipType}`;
      const existing = inventory.entries.find(e => e.id === entryId || (e.page === dest && e.slot === clipType));
      if (existing) {
        existing.stock_status = 'downloaded';
        existing.file_path = path.relative(config.PROJECT_ROOT, outputPath);
        existing.notes = `Swept from Downloads ${new Date().toISOString().split('T')[0]}. ${existing.notes || ''}`.trim();
        console.log(`  Updated inventory: ${existing.id}`);
      } else {
        // Add new entry
        inventory.entries.push({
          id: entryId,
          page: dest,
          page_type: 'destination',
          section: clipType === 'hero' ? 'hero' : (clipType === 'preview' ? 'preview' : descriptor),
          slot: clipType === 'break' ? 'immersive_break' : clipType,
          description: `${dest} ${clipType}${descriptor ? ' - ' + descriptor : ''}`,
          search_terms: '',
          alt_search: '',
          duration_sec: '15-20',
          resolution: clipType === 'preview' ? '1080p' : '4K',
          looping: true,
          audio: false,
          source: 'stock',
          own_footage_status: 'n/a',
          stock_status: 'downloaded',
          priority: clipType === 'hero' ? 'p0' : (clipType === 'break' ? 'p1' : 'p2'),
          shutterstock_url: '',
          file_path: path.relative(config.PROJECT_ROOT, outputPath),
          notes: `Swept from Downloads ${new Date().toISOString().split('T')[0]}`,
        });
        console.log(`  Added to inventory: ${entryId}`);
      }
    }

    console.log(`  ✅ Done`);
    results.moved++;
  }

  // Save inventory
  if (inventory && results.moved > 0 && !dryRun) {
    fs.writeFileSync(config.INVENTORY_PATH, yaml.dump(inventory, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    }));
    console.log(`\n  Inventory saved.`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  SWEEP COMPLETE');
  console.log(`  Moved: ${results.moved}`);
  console.log(`  Skipped: ${results.skipped}`);
  if (!keepOriginals && results.moved > 0) {
    console.log(`  Originals removed from Downloads ✓`);
  }
  console.log(`${'═'.repeat(60)}`);
  console.log();
  if (results.moved > 0) {
    console.log('  Next: Run step 2 to compress for web:');
    console.log('    node video-tracking/pipeline/2-batch-process.cjs');
    console.log();
    console.log('  Or run the full pipeline from step 2:');
    console.log('    node video-tracking/pipeline/run-pipeline.cjs --from 2');
  }
  console.log();

  rl.close();
}

function loadInventory() {
  if (!fs.existsSync(config.INVENTORY_PATH)) return null;
  try {
    const inv = yaml.load(fs.readFileSync(config.INVENTORY_PATH, 'utf8'));
    if (!inv.entries) inv.entries = [];
    return inv;
  } catch (e) {
    console.warn('  Warning: Could not parse inventory YAML. Skipping inventory updates.');
    return null;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  rl.close();
  process.exit(1);
});
