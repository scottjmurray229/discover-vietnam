#!/usr/bin/env node
/**
 * STEP 1: Sweep ~/Downloads/ for new video clips, rename & organize
 *
 * No API calls. User manually downloads clips from Storyblocks/Shutterstock,
 * then runs this script to sweep, rename, and organize into the pipeline.
 *
 * Naming rules:
 *   - Storyblocks clips (descriptive names): keep original filename for breaks
 *   - Shutterstock clips (numeric IDs like 1234567890.mp4): rename to {dest}-break-N.mp4
 *   - Hero (any source): always renamed to {dest}-hero.mp4
 *
 * Usage:
 *   node video-tracking/pipeline/1-sweep-downloads.cjs                         # Interactive
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --dest miami            # Auto (picks hero from Storyblocks)
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --dest miami --hero-id 1234567890  # Shutterstock hero
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --hours 2               # Only files from last 2 hours
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --dry-run               # Preview without moving
 *   node video-tracking/pipeline/1-sweep-downloads.cjs --keep-originals        # Don't delete from Downloads
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
const heroId = args.includes('--hero-id') ? args[args.indexOf('--hero-id') + 1] : null; // Shutterstock ID to use as hero
const hoursBack = args.includes('--hours') ? parseFloat(args[args.indexOf('--hours') + 1]) : 24;
const dryRun = args.includes('--dry-run');
const keepOriginals = args.includes('--keep-originals');
const autoMode = !!destFilter; // Non-interactive when --dest is specified

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

// Detect Shutterstock clip — purely numeric ID (1234567890.mp4) or shutterstock_ prefix
function isShutterstockId(filename) {
  const base = path.basename(filename, path.extname(filename));
  return /^\d+$/.test(base) || /^shutterstock_/i.test(base);
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

// Hero keyword scoring — higher = better hero candidate
const HERO_KEYWORDS = [
  { words: ['aerial', 'drone'], score: 10 },
  { words: ['establishing', 'overview', 'panorama', 'panoramic'], score: 8 },
  { words: ['skyline', 'coastline', 'shoreline'], score: 6 },
  { words: ['island', 'beach', 'ocean', 'bay', 'harbor'], score: 4 },
  { words: ['sunset', 'sunrise', 'golden'], score: 2 },
];

function heroScore(filename, dest) {
  const lower = filename.toLowerCase();
  let score = 0;
  // Big bonus if filename contains the destination slug — prevents wrong-dest clips winning
  if (dest && lower.includes(dest.replace(/-/g, ' ')) || lower.includes(dest)) score += 50;
  for (const { words, score: s } of HERO_KEYWORDS) {
    if (words.some(w => lower.includes(w))) score += s;
  }
  return score;
}

// Pick the best Storyblocks clip to be hero (highest keyword score, largest file as tiebreaker)
function pickHero(clips, heroIdOverride) {
  if (heroIdOverride) {
    // User specified a Shutterstock ID — match bare number or shutterstock_ prefix
    const idNum = heroIdOverride.replace(/\D/g, '');
    const match = clips.find(c => {
      const base = path.basename(c.filename, path.extname(c.filename));
      return base === idNum || base === `shutterstock_${idNum}` || base.endsWith(idNum);
    });
    if (match) return match;
    console.log(`  Warning: --hero-id ${heroIdOverride} not found in Downloads. Falling back to auto-pick.`);
  }

  // Only consider Storyblocks clips (descriptive names) for auto-pick
  const storyblocks = clips.filter(c => !isShutterstockId(c.filename));
  if (storyblocks.length === 0) return null; // All Shutterstock — no auto hero

  const scored = storyblocks.map(c => ({
    clip: c,
    score: heroScore(c.filename, destFilter),
    sizeMB: parseFloat(c.sizeMB),
  }));
  scored.sort((a, b) => b.score - a.score || b.sizeMB - a.sizeMB);
  return scored[0].clip;
}

function getOutputDir(clipType) {
  if (clipType === 'hero') return path.join(config.RAW_DOWNLOADS, 'heroes');
  if (clipType === 'preview') return path.join(config.RAW_DOWNLOADS, 'thumbnails');
  return path.join(config.RAW_DOWNLOADS, 'breaks');
}

// Naming rules:
//   hero            → {dest}-hero.mp4
//   break, Storyblocks → keep original filename
//   break, Shutterstock → {dest}-break-N.mp4
function getOutputFilename(dest, clipType, originalFilename, breakNum) {
  if (clipType === 'hero') return `${dest}-hero.mp4`;
  if (clipType === 'preview') return `${dest}-preview.mp4`;
  if (isShutterstockId(originalFilename)) return `${dest}-break-${breakNum}.mp4`;
  return originalFilename; // Storyblocks — keep descriptive name
}

// Count existing Shutterstock-style numbered breaks for a destination
function countExistingBreaks(dest) {
  const breaksDir = path.join(config.RAW_DOWNLOADS, 'breaks');
  if (!fs.existsSync(breaksDir)) return 0;
  return fs.readdirSync(breaksDir)
    .filter(f => f.startsWith(`${dest}-break-`) && /\d+\.mp4$/.test(f)).length;
}

// Guess clip type from filename (interactive fallback)
function guessType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('hero') || lower.includes('aerial') || lower.includes('drone')) return 'hero';
  if (lower.includes('preview') || lower.includes('thumb') || lower.includes('card')) return 'preview';
  return 'break';
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
  if (heroId) console.log(`  Hero override (Shutterstock): ${heroId}`);
  if (autoMode) console.log(`  Mode: AUTO (non-interactive)`);
  if (dryRun) console.log(`  Mode: DRY RUN`);
  if (keepOriginals) console.log(`  Keeping originals in Downloads`);
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
    const tag = isShutterstockId(c.filename) ? '[SS]' : '[SB]';
    console.log(`    [${i + 1}] ${tag} ${c.filename}  (${c.sizeMB} MB, ${age}h ago)`);
  });
  console.log();

  // Show known destinations for reference (interactive only)
  if (!autoMode && knownDests.length > 0) {
    console.log('  Known destinations:');
    const cols = 4;
    for (let i = 0; i < knownDests.length; i += cols) {
      const row = knownDests.slice(i, i + cols).map(d => d.padEnd(25)).join('');
      console.log(`    ${row}`);
    }
    console.log();
  }

  const results = { moved: 0, skipped: 0 };
  const inventory = loadInventory();

  if (autoMode) {
    // ── AUTO MODE ────────────────────────────────────────────────────────────
    const dest = destFilter.trim().toLowerCase();

    // Pick hero
    const heroClip = pickHero(clips, heroId);
    if (heroClip) {
      console.log(`  Hero: ${heroClip.filename}`);
    } else {
      console.log(`  Hero: none auto-selected (all Shutterstock, no --hero-id given — first clip becomes break-1)`);
    }

    let ssBreakNum = countExistingBreaks(dest);

    for (const clip of clips) {
      const isHero = heroClip && clip.filename === heroClip.filename;
      const clipType = isHero ? 'hero' : 'break';
      if (!isHero && isShutterstockId(clip.filename)) ssBreakNum++;

      const outputFilename = getOutputFilename(dest, clipType, clip.filename, ssBreakNum);
      const outputDir = getOutputDir(clipType);
      const outputPath = path.join(outputDir, outputFilename);
      const ytPath = path.join(config.YOUTUBE_RAW, outputFilename);

      console.log(`\n  ${clip.filename}`);
      console.log(`    type    : ${clipType}${isShutterstockId(clip.filename) ? ' (Shutterstock)' : ' (Storyblocks)'}`);
      console.log(`    → raw   : raw-downloads/${clipType === 'hero' ? 'heroes' : 'breaks'}/${outputFilename}`);
      console.log(`    → yt    : youtube/raw/${outputFilename}`);

      if (dryRun) { results.moved++; continue; }

      fs.mkdirSync(outputDir, { recursive: true });
      fs.mkdirSync(config.YOUTUBE_RAW, { recursive: true });

      fs.copyFileSync(clip.fullPath, outputPath);
      fs.copyFileSync(clip.fullPath, ytPath);
      if (!keepOriginals) fs.unlinkSync(clip.fullPath);

      updateInventory(inventory, dest, clipType, outputFilename, outputPath);
      results.moved++;
    }

  } else {
    // ── INTERACTIVE MODE ─────────────────────────────────────────────────────
    let ssBreakNum = 0;

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`  [${i + 1}/${clips.length}] ${isShutterstockId(clip.filename) ? '[SS]' : '[SB]'} ${clip.filename}  (${clip.sizeMB} MB)`);
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

      // For Shutterstock breaks, auto-number; for Storyblocks breaks, keep name
      if (clipType === 'break' && isShutterstockId(clip.filename)) {
        ssBreakNum = countExistingBreaks(dest) + (ssBreakNum || 0) + 1;
      }

      const outputFilename = getOutputFilename(dest, clipType, clip.filename, ssBreakNum);
      const outputDir = getOutputDir(clipType);
      const outputPath = path.join(outputDir, outputFilename);
      const ytPath = path.join(config.YOUTUBE_RAW, outputFilename);

      console.log(`\n  → raw-downloads/${clipType === 'hero' ? 'heroes' : clipType === 'preview' ? 'thumbnails' : 'breaks'}/${outputFilename}`);
      console.log(`  → youtube/raw/${outputFilename}`);

      if (dryRun) {
        console.log('  [DRY RUN] Would move file.');
        results.moved++;
        continue;
      }

      fs.mkdirSync(outputDir, { recursive: true });
      fs.mkdirSync(config.YOUTUBE_RAW, { recursive: true });

      fs.copyFileSync(clip.fullPath, outputPath);
      fs.copyFileSync(clip.fullPath, ytPath);
      if (!keepOriginals) fs.unlinkSync(clip.fullPath);

      updateInventory(inventory, dest, clipType, outputFilename, outputPath);
      console.log(`  ✅ Done`);
      results.moved++;
    }
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
  console.log(`  Moved: ${results.moved}  |  Skipped: ${results.skipped}`);
  if (!keepOriginals && results.moved > 0) console.log(`  Originals removed from Downloads ✓`);
  console.log(`${'═'.repeat(60)}\n`);

  if (results.moved > 0) {
    console.log('  Next: node video-tracking/pipeline/2-batch-process.cjs --dest ' + (destFilter || '<dest>'));
    console.log();
  }

  rl.close();
}

function updateInventory(inventory, dest, clipType, outputFilename, outputPath) {
  if (!inventory) return;
  const entryId = `${dest}-${clipType === 'break' ? path.basename(outputFilename, '.mp4') : clipType}`;
  const existing = inventory.entries.find(e => e.id === entryId || (e.page === dest && e.slot === clipType && clipType === 'hero'));
  if (existing) {
    existing.stock_status = 'downloaded';
    existing.file_path = path.relative(config.PROJECT_ROOT, outputPath);
    existing.notes = `Swept ${new Date().toISOString().split('T')[0]}. ${existing.notes || ''}`.trim();
  } else {
    inventory.entries.push({
      id: entryId,
      page: dest,
      page_type: 'destination',
      section: clipType === 'hero' ? 'hero' : clipType === 'preview' ? 'preview' : path.basename(outputFilename, '.mp4'),
      slot: clipType === 'break' ? 'immersive_break' : clipType,
      description: `${dest} ${clipType} — ${path.basename(outputFilename, '.mp4')}`,
      source: 'stock',
      own_footage_status: 'n/a',
      stock_status: 'downloaded',
      priority: clipType === 'hero' ? 'p0' : 'p1',
      file_path: path.relative(config.PROJECT_ROOT, outputPath),
      notes: `Swept ${new Date().toISOString().split('T')[0]}`,
    });
  }
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
