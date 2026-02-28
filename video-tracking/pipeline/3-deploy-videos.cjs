#!/usr/bin/env node
/**
 * STEP 3: Update frontmatter, videoMap, inventory YAML, then build & deploy
 *
 * Scans public/videos/destinations/ for processed clips, then:
 *   1. Updates heroVideo in destination .md frontmatter
 *   2. Updates videoMap in destinations/index.astro
 *   3. Updates file_path in video-inventory.yaml
 *   4. Builds with Astro
 *   5. Deploys to Cloudflare Pages
 *
 * Usage:
 *   node video-tracking/pipeline/3-deploy-videos.cjs              # Full run
 *   node video-tracking/pipeline/3-deploy-videos.cjs --no-deploy  # Update files only
 *   node video-tracking/pipeline/3-deploy-videos.cjs --dry-run    # Preview changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const { loadConfig } = require('./config-loader.cjs');

const config = loadConfig();

const args = process.argv.slice(2);
const noDeploy = args.includes('--no-deploy');
const dryRun = args.includes('--dry-run');

const DEST_DIR = path.join(config.PROJECT_ROOT, 'src', 'content', 'destinations');
const INDEX_PAGE = path.join(config.PROJECT_ROOT, 'src', 'pages', 'destinations', 'index.astro');

// Scan for processed videos
function findProcessedVideos() {
  const videosDir = config.PUBLIC_VIDEOS;
  if (!fs.existsSync(videosDir)) return { heroes: [], previews: [], breaks: [] };

  const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.mp4'));

  return {
    heroes: files.filter(f => f.includes('-hero.mp4')),
    previews: files.filter(f => f.includes('-preview.mp4')),
    breaks: files.filter(f => f.includes('-break-')),
  };
}

// Extract destination slug from filename
function slugFromFilename(filename) {
  // Handle multi-part slugs: mt-pulag-hero.mp4, el-nido-hero.mp4, etc.
  const match = filename.match(/^(.+?)-(hero|break-|preview)/);
  return match ? match[1] : filename.replace('.mp4', '');
}

// Update heroVideo in destination frontmatter
function updateFrontmatter(slug, videoPath) {
  const mdPath = path.join(DEST_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.log(`    ⚠️  No .md file for ${slug}`);
    return false;
  }

  let content = fs.readFileSync(mdPath, 'utf8');
  const fmMatch = content.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!fmMatch) return false;

  const fm = fmMatch[2];
  const webPath = `/videos/destinations/${videoPath}`;

  // Check if already set to this path
  if (fm.includes(`heroVideo: "${webPath}"`) || fm.includes(`heroVideo: ${webPath}`)) {
    return false; // Already up to date
  }

  // Replace heroVideo line
  const newFm = fm.replace(
    /heroVideo:\s*"?.*?"?$/m,
    `heroVideo: "${webPath}"`
  );

  if (newFm === fm) {
    // heroVideo line not found, add it after title
    return false;
  }

  if (!dryRun) {
    content = content.replace(fmMatch[0], `${fmMatch[1]}${newFm}${fmMatch[3]}`);
    fs.writeFileSync(mdPath, content);
  }

  return true;
}

// Update videoMap in destinations/index.astro
function updateVideoMap(previews) {
  if (previews.length === 0) return 0;

  let content = fs.readFileSync(INDEX_PAGE, 'utf8');

  // Find the videoMap object
  const mapMatch = content.match(/const videoMap[^{]*\{([^}]*)\}/s);
  if (!mapMatch) {
    console.log('  ⚠️  Could not find videoMap in destinations/index.astro');
    return 0;
  }

  let mapContent = mapMatch[1];
  let added = 0;

  for (const preview of previews) {
    const slug = slugFromFilename(preview);
    const webPath = `/videos/destinations/${preview}`;

    // Check if already in map
    if (mapContent.includes(`'${slug}'`) || mapContent.includes(`"${slug}"`)) {
      continue;
    }

    // Add entry before the closing brace
    mapContent = mapContent.trimEnd();
    if (!mapContent.endsWith(',')) mapContent += ',';
    mapContent += `\n  ${slug}: '${webPath}',`;
    added++;
  }

  if (added > 0 && !dryRun) {
    content = content.replace(mapMatch[0], `const videoMap: Record<string, string> = {${mapContent}\n}`);
    fs.writeFileSync(INDEX_PAGE, content);
  }

  return added;
}

// Update inventory YAML file_path entries
function updateInventory(processedFiles) {
  const inv = yaml.load(fs.readFileSync(config.INVENTORY_PATH, 'utf8'));
  let updated = 0;

  for (const entry of inv.entries) {
    if (entry.stock_status !== 'downloaded') continue;
    if (entry.file_path && fs.existsSync(path.join(config.PROJECT_ROOT, 'public', entry.file_path))) continue;

    // Try to match with a processed file
    let expectedFile;
    if (entry.slot === 'hero') {
      expectedFile = `${entry.page}-hero.mp4`;
    } else if (entry.slot === 'immersive_break') {
      expectedFile = `${entry.page}-break-${entry.section}.mp4`;
    } else if (entry.slot === 'thumbnail') {
      expectedFile = `${entry.page}-preview.mp4`;
    }

    if (expectedFile && processedFiles.includes(expectedFile)) {
      entry.file_path = `/videos/destinations/${expectedFile}`;
      updated++;
    }
  }

  if (updated > 0 && !dryRun) {
    fs.writeFileSync(config.INVENTORY_PATH, yaml.dump(inv, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    }));
  }

  return updated;
}

// Main
function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   DEPLOY VIDEOS — DISCOVER PHILIPPINES                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (dryRun) console.log('DRY RUN — no files will be modified\n');

  const { heroes, previews, breaks } = findProcessedVideos();
  const allFiles = [...heroes, ...previews, ...breaks];

  console.log(`  Videos in public/videos/destinations/:`);
  console.log(`    Heroes: ${heroes.length}`);
  console.log(`    Previews: ${previews.length}`);
  console.log(`    Breaks: ${breaks.length}`);
  console.log();

  if (allFiles.length === 0) {
    console.log('  No processed videos found. Run Step 2 first.');
    return;
  }

  // 1. Update frontmatter
  console.log('  1. Updating heroVideo frontmatter...');
  let fmUpdated = 0;
  for (const hero of heroes) {
    const slug = slugFromFilename(hero);
    if (updateFrontmatter(slug, hero)) {
      console.log(`     ✅ ${slug}.md → heroVideo: /videos/destinations/${hero}`);
      fmUpdated++;
    }
  }
  console.log(`     ${fmUpdated} frontmatter files updated.\n`);

  // 2. Update videoMap
  console.log('  2. Updating videoMap in destinations/index.astro...');
  const mapAdded = updateVideoMap(previews);
  console.log(`     ${mapAdded} preview entries added.\n`);

  // 3. Update inventory
  console.log('  3. Updating video-inventory.yaml paths...');
  const invUpdated = updateInventory(allFiles);
  console.log(`     ${invUpdated} inventory entries updated.\n`);

  if (dryRun) {
    console.log('  DRY RUN complete. No files were modified.');
    return;
  }

  // 4. Build
  if (!noDeploy) {
    console.log('  4. Building with Astro...');
    try {
      execSync('npx astro build', {
        cwd: config.PROJECT_ROOT,
        stdio: 'inherit',
        timeout: 300000,
      });
      console.log('     ✅ Build complete.\n');
    } catch (err) {
      console.error('     ❌ Build failed. Fix errors before deploying.');
      return;
    }

    // 5. Deploy
    console.log('  5. Deploying to Cloudflare Pages...');
    try {
      execSync('npx wrangler pages deploy dist --project-name=discover-philippines --commit-dirty=true', {
        cwd: config.PROJECT_ROOT,
        stdio: 'inherit',
        timeout: 300000,
      });
      console.log('     ✅ Deployed.\n');
    } catch (err) {
      console.error('     ❌ Deploy failed.');
      return;
    }
  }

  console.log(`${'═'.repeat(60)}`);
  console.log('  DEPLOY COMPLETE');
  console.log(`  Frontmatter updated: ${fmUpdated}`);
  console.log(`  VideoMap entries added: ${mapAdded}`);
  console.log(`  Inventory paths updated: ${invUpdated}`);
  if (!noDeploy) console.log('  Site built and deployed to Cloudflare Pages');
  console.log(`${'═'.repeat(60)}\n`);
}

main();
