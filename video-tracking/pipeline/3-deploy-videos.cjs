#!/usr/bin/env node
/**
 * STEP 3: WIRE & DEPLOY VIDEOS — Comprehensive video wiring + audit
 *
 * Scans public/videos/destinations/ for processed clips, then wires into:
 *   1. heroVideo in destination .md frontmatter
 *   2. destination-videos.ts (shared video map for homepage + destination index cards)
 *   3. Inline immersive break <video> tags in destination markdown body
 *   4. relatedDestinations[].videoSrc in destination frontmatter
 *   5. Broken static page hero videos (homepage, dest index, blog index, plan, about)
 *   6. video-inventory.yaml paths
 *   + Post-completion VIDEO WIRING AUDIT
 *
 * Usage:
 *   node video-tracking/pipeline/3-deploy-videos.cjs              # Full run + deploy
 *   node video-tracking/pipeline/3-deploy-videos.cjs --no-deploy  # Wire files only
 *   node video-tracking/pipeline/3-deploy-videos.cjs --dry-run    # Preview changes
 *   node video-tracking/pipeline/3-deploy-videos.cjs --audit-only # Just run the audit
 *   node video-tracking/pipeline/3-deploy-videos.cjs --dest miami # Wire single destination
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig } = require('./config-loader.cjs');

let yaml;
try { yaml = require('js-yaml'); } catch (e) { /* optional — only needed for inventory */ }

const config = loadConfig();

const args = process.argv.slice(2);
const noDeploy = args.includes('--no-deploy');
const dryRun = args.includes('--dry-run');
const auditOnly = args.includes('--audit-only');
const destFilter = args.includes('--dest') ? args[args.indexOf('--dest') + 1] : null;

const DEST_CONTENT = path.join(config.PROJECT_ROOT, 'src', 'content', 'destinations');
const BLOG_CONTENT = path.join(config.PROJECT_ROOT, 'src', 'content', 'blog');
const PAGES_DIR = path.join(config.PROJECT_ROOT, 'src', 'pages');
const DATA_DIR = path.join(config.PROJECT_ROOT, 'src', 'data');
const DEST_VIDEOS = config.PUBLIC_VIDEOS; // public/videos/destinations/

// ═══════════════════════════════════════════════════════════════════
//  SCAN — find all processed videos on disk
// ═══════════════════════════════════════════════════════════════════

function scanVideos() {
  const result = { heroes: {}, previews: {}, breaks: {} };
  if (!fs.existsSync(DEST_VIDEOS)) return result;

  const files = fs.readdirSync(DEST_VIDEOS).filter(f => /\.(mp4|mov)$/i.test(f));

  for (const f of files) {
    const slug = slugFromFilename(f);

    if (f.includes('-hero')) {
      // Prefer .mp4 over .mov
      if (!result.heroes[slug] || (f.endsWith('.mp4') && !result.heroes[slug].endsWith('.mp4'))) {
        result.heroes[slug] = f;
      }
    } else if (f.includes('-preview')) {
      if (!result.previews[slug] || (f.endsWith('.mp4') && !result.previews[slug].endsWith('.mp4'))) {
        result.previews[slug] = f;
      }
    } else if (f.includes('-break-')) {
      if (!result.breaks[slug]) result.breaks[slug] = [];
      result.breaks[slug].push(f);
    }
  }

  // Sort break files by number; prefer .mp4 over .mov for same break number
  for (const slug of Object.keys(result.breaks)) {
    const byNum = {};
    for (const f of result.breaks[slug]) {
      const num = extractBreakNum(f);
      if (!byNum[num] || (f.endsWith('.mp4') && !byNum[num].endsWith('.mp4'))) {
        byNum[num] = f;
      }
    }
    result.breaks[slug] = Object.values(byNum).sort((a, b) => {
      const nA = extractBreakNum(a);
      const nB = extractBreakNum(b);
      if (nA !== nB) return nA - nB;
      return a.localeCompare(b);
    });
  }

  return result;
}

function slugFromFilename(filename) {
  const m = filename.match(/^(.+?)-(hero|break-|preview)/);
  return m ? m[1] : filename.replace(/\.(mp4|mov)$/i, '');
}

function extractBreakNum(filename) {
  const m = filename.match(/-break-(\d+)/);
  return m ? parseInt(m[1]) : 999;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 1 — heroVideo in destination frontmatter
// ═══════════════════════════════════════════════════════════════════

function wireHeroFrontmatter(heroes) {
  if (!fs.existsSync(DEST_CONTENT)) return 0;
  let updated = 0;

  for (const [slug, file] of Object.entries(heroes)) {
    if (destFilter && slug !== destFilter) continue;

    const mdPath = path.join(DEST_CONTENT, `${slug}.md`);
    if (!fs.existsSync(mdPath)) {
      console.log(`    ⚠️  No .md file for ${slug}`);
      continue;
    }

    let content = fs.readFileSync(mdPath, 'utf8');
    const webPath = `/videos/destinations/${file}`;

    // Already set to this exact path — skip
    if (content.includes(`heroVideo: "${webPath}"`)) continue;

    // Replace existing heroVideo line
    let replaced = content.replace(
      /heroVideo:\s*["']?.*?["']?\s*$/m,
      `heroVideo: "${webPath}"`
    );

    if (replaced === content) {
      // No heroVideo line in frontmatter — insert one before closing ---
      const fmMatch = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
      if (!fmMatch) continue;
      const eol = content.includes('\r\n') ? '\r\n' : '\n';
      replaced = `${fmMatch[1]}${fmMatch[2]}${eol}heroVideo: "${webPath}"${fmMatch[3]}${content.slice(fmMatch[0].length)}`;
    }

    if (!dryRun) fs.writeFileSync(mdPath, replaced);
    console.log(`     ✅ ${slug}.md → heroVideo`);
    updated++;
  }

  return updated;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 2 — destination-videos.ts (card preview map)
// ═══════════════════════════════════════════════════════════════════

function wireDestinationVideoMap(heroes, previews) {
  const tsPath = path.join(DATA_DIR, 'destination-videos.ts');
  if (!fs.existsSync(tsPath)) {
    // Create the file from template
    if (!dryRun) {
      fs.mkdirSync(path.dirname(tsPath), { recursive: true });
      fs.writeFileSync(tsPath, `export const destinationVideoMap: Record<string, string> = {\n};\n`);
      console.log('    📄 Created destination-videos.ts');
    } else {
      console.log('    📄 Would create destination-videos.ts');
      return 0;
    }
  }

  let content = fs.readFileSync(tsPath, 'utf8');
  let added = 0;

  // Collect all slugs that have at least one video
  const allSlugs = new Set([...Object.keys(previews), ...Object.keys(heroes)]);

  for (const slug of allSlugs) {
    if (destFilter && slug !== destFilter) continue;
    // Already in the map — skip (check quoted and unquoted keys)
    if (content.includes(`'${slug}'`) || content.includes(`"${slug}"`) || new RegExp(`^\\s*${slug}\\s*:`, 'm').test(content)) continue;

    // Prefer preview, fall back to hero
    const videoFile = previews[slug] || heroes[slug];
    if (!videoFile) continue;

    const webPath = `/videos/destinations/${videoFile}`;

    // Insert before the closing `};`
    const insertIdx = content.lastIndexOf('};');
    if (insertIdx === -1) continue;

    const entry = `  '${slug}': '${webPath}',\n`;
    content = content.slice(0, insertIdx) + entry + content.slice(insertIdx);
    added++;
  }

  if (added > 0 && !dryRun) {
    fs.writeFileSync(tsPath, content);
  }

  return added;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 3 — Inline immersive break videos in markdown body
// ═══════════════════════════════════════════════════════════════════

function wireInlineBreaks(breaks) {
  if (!fs.existsSync(DEST_CONTENT)) return 0;
  let totalWired = 0;

  for (const [slug, breakFiles] of Object.entries(breaks)) {
    if (destFilter && slug !== destFilter) continue;
    if (!breakFiles || breakFiles.length === 0) continue;

    const mdPath = path.join(DEST_CONTENT, `${slug}.md`);
    if (!fs.existsSync(mdPath)) continue;

    let content = fs.readFileSync(mdPath, 'utf8');

    // Find which break files are already referenced
    const usedBreaks = new Set();
    for (const bf of breakFiles) {
      if (content.includes(bf)) usedBreaks.add(bf);
    }

    // Get available (un-wired) break files in order
    const available = breakFiles.filter(f => !usedBreaks.has(f));
    if (available.length === 0) continue;

    // Pass A: Wire empty <video ...></video> tags (no <source> inside)
    let idx = 0;
    let wiredThis = 0;

    content = content.replace(
      /(<video\s[^>]*>)\s*(<\/video>)/g,
      (match, openTag, closeTag) => {
        if (idx >= available.length) return match;

        const bf = available[idx++];
        const webPath = `/videos/destinations/${bf}`;
        const vtype = bf.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';

        // Ensure preload="metadata" attribute
        let tag = openTag;
        if (!tag.includes('preload=')) {
          tag = tag.replace('>', ' preload="metadata">');
        }

        wiredThis++;
        return `${tag}\n    <source src="${webPath}" type="${vtype}" />\n  ${closeTag}`;
      }
    );

    // Pass B: Convert gradient-only breaks to video breaks
    // Pattern: <div class="immersive-break-inline" style="background: ..."><div class="immersive-content">...</div></div>
    content = content.replace(
      /<div class="immersive-break-inline"\s+style="background:\s*([^"]+)">\s*<div class="immersive-content">\s*([\s\S]*?)<\/div>\s*<\/div>/g,
      (match, gradient, innerContent) => {
        if (idx >= available.length) return match;

        const bf = available[idx++];
        const webPath = `/videos/destinations/${bf}`;
        const vtype = bf.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';

        wiredThis++;
        return `<div class="immersive-break-inline">\n<video autoplay muted loop playsinline preload="metadata">\n    <source src="${webPath}" type="${vtype}" />\n  </video>\n<div class="break-overlay" style="background: ${gradient}">\n${innerContent.trim()}\n</div></div>`;
      }
    );

    if (wiredThis > 0) {
      if (!dryRun) fs.writeFileSync(mdPath, content);
      console.log(`     ✅ ${slug}.md → ${wiredThis} break(s) wired`);
      totalWired += wiredThis;
    }
  }

  return totalWired;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 4 — relatedDestinations[].videoSrc in frontmatter
// ═══════════════════════════════════════════════════════════════════

function wireRelatedVideoSrc(heroes, previews) {
  if (!fs.existsSync(DEST_CONTENT)) return 0;
  let updated = 0;

  const mdFiles = fs.readdirSync(DEST_CONTENT).filter(f => f.endsWith('.md'));

  for (const file of mdFiles) {
    const slug = file.replace('.md', '');
    if (destFilter && slug !== destFilter) continue;

    const mdPath = path.join(DEST_CONTENT, file);
    let content = fs.readFileSync(mdPath, 'utf8');

    // Extract frontmatter only (between --- markers, handles CRLF)
    const fmMatch = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
    if (!fmMatch) continue;

    const beforeFM = fmMatch[1];
    let fm = fmMatch[2];
    const afterFM = fmMatch[3];
    let changed = false;

    // Process line by line within frontmatter
    const lines = fm.split('\n');
    let currentRelSlug = null;

    for (let i = 0; i < lines.length; i++) {
      // Detect "- slug: xxx"
      const slugMatch = lines[i].match(/^\s+-\s+slug:\s+["']?([\w-]+)["']?/);
      if (slugMatch) {
        currentRelSlug = slugMatch[1];
        continue;
      }

      // Detect empty videoSrc after a slug line
      if (currentRelSlug) {
        const vsMatch = lines[i].match(/^(\s+videoSrc:\s*)(.*)/);
        if (vsMatch) {
          const value = vsMatch[2].replace(/\r$/, '').trim();
          if (value === '""' || value === "''" || value === '') {
            // Wire if video exists for this related destination
            const videoFile = previews[currentRelSlug] || heroes[currentRelSlug];
            if (videoFile) {
              const cr = lines[i].endsWith('\r') ? '\r' : '';
              lines[i] = `${vsMatch[1]}"/videos/destinations/${videoFile}"${cr}`;
              changed = true;
            }
          }
          currentRelSlug = null;
        } else if (/^\s+\w+:/.test(lines[i].replace(/\r$/, '')) || /^\s+-\s/.test(lines[i])) {
          currentRelSlug = null; // Different field or next entry
        }
      }
    }

    if (changed) {
      fm = lines.join('\n');
      const newContent = content.replace(fmMatch[0], `${beforeFM}${fm}${afterFM}`);
      if (!dryRun) fs.writeFileSync(mdPath, newContent);
      console.log(`     ✅ ${slug}.md → relatedDestinations videoSrc`);
      updated++;
    }
  }

  return updated;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 5 — Fix broken hero videos on static pages
// ═══════════════════════════════════════════════════════════════════

function wireStaticPages(heroes) {
  const heroSlugs = Object.keys(heroes).sort();
  if (heroSlugs.length === 0) return 0;

  // Default replacement video (first alphabetical destination hero)
  const defaultHero = `/videos/destinations/${heroes[heroSlugs[0]]}`;

  // Recursively find all .astro pages
  const astroFiles = findFiles(PAGES_DIR, '.astro');
  let updated = 0;

  for (const filePath of astroFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    content = content.replace(
      /(<source\s+src=")([^"]+\.mp4)("\s+type="video\/mp4")/g,
      (match, prefix, currentSrc, suffix) => {
        const relPath = currentSrc.startsWith('/') ? currentSrc.slice(1) : currentSrc;
        const absPath = path.join(config.PROJECT_ROOT, 'public', relPath);

        if (fs.existsSync(absPath)) return match; // File exists, leave it

        changed = true;
        return `${prefix}${defaultHero}${suffix}`;
      }
    );

    if (changed) {
      if (!dryRun) fs.writeFileSync(filePath, content);
      const rel = path.relative(config.PROJECT_ROOT, filePath).replace(/\\/g, '/');
      console.log(`     ✅ ${rel} → fixed broken video ref`);
      updated++;
    }
  }

  return updated;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 5.5 — Wire videos to pillar pages & blog posts
// ═══════════════════════════════════════════════════════════════════

// Pick best available hero video for a page based on preferred slugs
function pickVideo(heroes, preferred) {
  for (const slug of preferred) {
    if (heroes[slug]) return `/videos/destinations/${heroes[slug]}`;
  }
  // Fallback to first available
  const first = Object.keys(heroes).sort()[0];
  return first ? `/videos/destinations/${heroes[first]}` : null;
}

function wirePillarPages(heroes) {
  // Page config: file path (relative to PAGES_DIR), hero tag to inject into, preferred video slugs
  const pillarPages = [
    { rel: 'beaches/index.astro',      heroTag: 'menu-hero',  preferred: ['clearwater', 'pensacola', 'destin'] },
    { rel: 'cuisine/index.astro',      heroTag: 'menu-hero',  preferred: ['miami', 'tampa', 'key-west'] },
    { rel: 'finer-things/index.astro', heroTag: 'ft-hero',    preferred: ['palm-beach', 'miami', 'naples'] },
    { rel: 'history/index.astro',      heroTag: 'menu-hero',  preferred: ['st-augustine', 'cape-canaveral', 'pensacola'] },
    { rel: 'practical/index.astro',    heroTag: 'menu-hero',  preferred: ['orlando', 'miami', 'tampa'] },
    { rel: 'theme-parks/index.astro',  heroTag: 'menu-hero',  preferred: ['orlando', 'tampa'] },
    { rel: 'wildlife/index.astro',     heroTag: 'menu-hero',  preferred: ['everglades', 'clearwater', 'sanibel-island'] },
    { rel: 'companion.astro',          heroTag: 'cp-hero',    preferred: ['miami', 'orlando', 'tampa'] },
    { rel: 'about/index.astro',        heroTag: 'about-hero', preferred: ['clearwater', 'miami', 'sarasota'] },
    { rel: 'festivals/index.astro',    heroTag: 'fest-hero',  preferred: ['tampa', 'miami', 'st-augustine'] },
  ];

  // Blog posts — wire heroVideo frontmatter field
  const blogPosts = [];
  if (fs.existsSync(BLOG_CONTENT)) {
    const heroSlugs = Object.keys(heroes).sort();
    let blogIdx = 0;
    for (const file of fs.readdirSync(BLOG_CONTENT).filter(f => f.endsWith('.md'))) {
      blogPosts.push({ file: path.join(BLOG_CONTENT, file), slug: heroSlugs[blogIdx % heroSlugs.length] });
      blogIdx++;
    }
  }

  let updated = 0;
  const videoTag = (src) =>
    `<video style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.35;pointer-events:none;z-index:0;" autoplay muted loop playsinline preload="metadata"><source src="${src}" type="video/mp4" /></video>`;

  for (const page of pillarPages) {
    const filePath = path.join(PAGES_DIR, page.rel);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if this page already has a working video
    const existingMatch = content.match(/<source\s+src="([^"]+\.mp4)"/);
    if (existingMatch) {
      const relPath = existingMatch[1].startsWith('/') ? existingMatch[1].slice(1) : existingMatch[1];
      if (fs.existsSync(path.join(config.PROJECT_ROOT, 'public', relPath))) continue; // already wired and file exists
    }

    const videoSrc = pickVideo(heroes, page.preferred);
    if (!videoSrc) continue;

    // Inject video as first child of the hero section/header
    // Handles: <header class="X-hero">, <section class="X-hero">, and partial class matches
    const heroClassPattern = new RegExp(`(<(?:header|section)[^>]*class="[^"]*${page.heroTag}[^"]*"[^>]*>)`);
    if (heroClassPattern.test(content)) {
      if (existingMatch) {
        // Replace broken video src
        content = content.replace(/<source\s+src="[^"]+\.mp4"/, `<source src="${videoSrc}"`);
      } else {
        // Inject new video tag after the opening hero tag
        content = content.replace(heroClassPattern, `$1\n  ${videoTag(videoSrc)}`);
      }
      if (!dryRun) fs.writeFileSync(filePath, content);
      const rel = path.relative(config.PROJECT_ROOT, filePath).replace(/\\/g, '/');
      console.log(`     ✅ ${rel} → ${videoSrc.split('/').pop()}`);
      updated++;
    }
  }

  // Wire blog posts heroVideo frontmatter
  for (const { file, slug } of blogPosts) {
    let content = fs.readFileSync(file, 'utf8');
    const heroVideoSrc = `/videos/destinations/${heroes[slug]}`;
    if (content.includes('heroVideo:')) {
      if (content.match(/heroVideo:\s*['"]{2}|heroVideo:\s*$/m)) {
        content = content.replace(/heroVideo:\s*(['"]?)(['"]?)/, `heroVideo: '${heroVideoSrc}'`);
        if (!dryRun) fs.writeFileSync(file, content);
        updated++;
      }
    }
  }

  return updated;
}

function findFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(full, ext));
    else if (entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 6 — Update inventory YAML
// ═══════════════════════════════════════════════════════════════════

function updateInventory(allFiles) {
  if (!yaml) return 0;
  if (!fs.existsSync(config.INVENTORY_PATH)) return 0;

  let inv;
  try {
    inv = yaml.load(fs.readFileSync(config.INVENTORY_PATH, 'utf8'));
    if (!inv || !inv.entries) return 0;
  } catch (e) {
    console.log('    ⚠️  Could not parse inventory YAML');
    return 0;
  }

  let updated = 0;

  for (const entry of inv.entries) {
    if (entry.stock_status !== 'downloaded') continue;
    if (entry.file_path && fs.existsSync(path.join(config.PROJECT_ROOT, 'public', entry.file_path))) continue;

    let expectedFile;
    if (entry.slot === 'hero') expectedFile = `${entry.page}-hero.mp4`;
    else if (entry.slot === 'immersive_break') expectedFile = `${entry.page}-break-${entry.section}.mp4`;
    else if (entry.slot === 'thumbnail') expectedFile = `${entry.page}-preview.mp4`;

    if (expectedFile && allFiles.includes(expectedFile)) {
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

// ═══════════════════════════════════════════════════════════════════
//  AUDIT — comprehensive video wiring report
// ═══════════════════════════════════════════════════════════════════

function runAudit(heroes, previews, breaks) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log('  VIDEO WIRING AUDIT');
  console.log(`${'━'.repeat(60)}\n`);

  if (!fs.existsSync(DEST_CONTENT)) {
    console.log('  No destinations content directory found.');
    return;
  }

  const mdFiles = fs.readdirSync(DEST_CONTENT).filter(f => f.endsWith('.md')).sort();
  const issues = [];

  // Read destination-videos.ts entries
  const videoMapEntries = readVideoMapEntries();

  // ── Destination table ──

  console.log('  DESTINATION VIDEO STATUS:\n');
  console.log('  ' + 'Destination'.padEnd(24) + 'Hero'.padEnd(7) + 'Card'.padEnd(7) + 'Map'.padEnd(6) + 'Breaks'.padEnd(12) + 'Related');
  console.log('  ' + '─'.repeat(64));

  for (const file of mdFiles) {
    const slug = file.replace('.md', '');
    if (destFilter && slug !== destFilter) continue;

    const content = fs.readFileSync(path.join(DEST_CONTENT, file), 'utf8');

    // Hero: is heroVideo set to a non-empty path?
    const heroWired = /heroVideo:\s*["'][^"']+["']/.test(content);
    const heroOnDisk = !!heroes[slug];

    // Preview / card
    const prevOnDisk = !!previews[slug];
    const inMap = videoMapEntries.has(slug);

    // Breaks
    const breakFilesCount = (breaks[slug] || []).length;
    const breakDivs = (content.match(/immersive-break-inline/g) || []).length;
    // Count breaks wired via <source src="...break..."> or <video src="...break...">
    const wiredBreaks = (content.match(/src="[^"]*-break-[^"]*\.(mp4|mov)"/g) || []).length;
    const unwired = breakDivs - wiredBreaks;

    // Related videoSrc
    const filledRel = (content.match(/videoSrc:\s*["'][^"']+["']/g) || []).length;
    const emptyRel = (content.match(/videoSrc:\s*["']["']/g) || []).length;

    // Format
    const h = heroWired ? '✅' : (heroOnDisk ? '⚠️' : '—');
    const p = prevOnDisk ? '✅' : '—';
    const m = inMap ? '✅' : ((prevOnDisk || heroOnDisk) ? '⚠️' : '—');
    const b = breakDivs === 0 ? '—'
      : (unwired === 0 ? `✅ ${wiredBreaks}` : `⚠️ ${wiredBreaks}/${breakDivs}`);
    const r = (filledRel + emptyRel) === 0 ? '—'
      : (emptyRel === 0 ? `✅ ${filledRel}` : `⚠️ ${filledRel}/${filledRel + emptyRel}`);

    console.log(`  ${slug.padEnd(24)}${h.padEnd(7)}${p.padEnd(7)}${m.padEnd(6)}${b.padEnd(12)}${r}`);

    // Collect issues
    if (heroOnDisk && !heroWired) issues.push(`${slug}: hero on disk but not in frontmatter`);
    if ((prevOnDisk || heroOnDisk) && !inMap) issues.push(`${slug}: video available but missing from destination-videos.ts`);
    if (unwired > 0) {
      const unusedBreaks = breakFilesCount - wiredBreaks;
      if (unusedBreaks > 0) {
        issues.push(`${slug}: ${unwired} inline break(s) not wired — ${unusedBreaks} unused break file(s) on disk, run script to wire`);
      } else if (breakFilesCount > 0) {
        issues.push(`${slug}: ${unwired} inline break div(s) need more clips — all ${breakFilesCount} break file(s) already used`);
      } else {
        issues.push(`${slug}: ${unwired} inline break div(s) with no video — download break clips`);
      }
    }
    if (emptyRel > 0) issues.push(`${slug}: ${emptyRel} relatedDestination(s) with empty videoSrc`);
  }

  // ── Static pages ──

  console.log(`\n  STATIC PAGE HEROES:\n`);

  const staticPages = [
    { name: 'Homepage',       p: path.join(PAGES_DIR, 'index.astro') },
    { name: 'Dest Index',     p: path.join(PAGES_DIR, 'destinations', 'index.astro') },
    { name: 'Blog Index',     p: path.join(PAGES_DIR, 'blog', 'index.astro') },
    { name: 'Plan',           p: path.join(PAGES_DIR, 'plan.astro') },
    { name: 'About',          p: path.join(PAGES_DIR, 'about', 'index.astro') },
    { name: 'About/Scott',    p: path.join(PAGES_DIR, 'about', 'scott.astro') },
    { name: 'Cuisine',        p: path.join(PAGES_DIR, 'cuisine', 'index.astro') },
    { name: 'Festivals',      p: path.join(PAGES_DIR, 'festivals', 'index.astro') },
    { name: 'Beaches',        p: path.join(PAGES_DIR, 'beaches', 'index.astro') },
    { name: 'Finer Things',   p: path.join(PAGES_DIR, 'finer-things', 'index.astro') },
    { name: 'History',        p: path.join(PAGES_DIR, 'history', 'index.astro') },
    { name: 'Practical',      p: path.join(PAGES_DIR, 'practical', 'index.astro') },
    { name: 'Theme Parks',    p: path.join(PAGES_DIR, 'theme-parks', 'index.astro') },
    { name: 'Wildlife',       p: path.join(PAGES_DIR, 'wildlife', 'index.astro') },
    { name: 'Companion',      p: path.join(PAGES_DIR, 'companion.astro') },
  ];

  for (const page of staticPages) {
    if (!fs.existsSync(page.p)) continue;
    const content = fs.readFileSync(page.p, 'utf8');
    const match = content.match(/<source\s+src="([^"]+\.mp4)"/);
    if (match) {
      const src = match[1];
      const relPath = src.startsWith('/') ? src.slice(1) : src;
      const exists = fs.existsSync(path.join(config.PROJECT_ROOT, 'public', relPath));
      console.log(`  ${page.name.padEnd(18)} ${exists ? '✅' : '❌'} ${src}`);
      if (!exists) issues.push(`${page.name}: references ${src} — file not found on disk`);
    } else {
      console.log(`  ${page.name.padEnd(18)} — no video`);
    }
  }

  // ── Totals ──

  const totalHeroes = Object.keys(heroes).length;
  const totalPreviews = Object.keys(previews).length;
  const totalBreaks = Object.values(breaks).reduce((s, a) => s + a.length, 0);

  console.log(`\n  VIDEO FILES ON DISK: ${totalHeroes} heroes, ${totalPreviews} previews, ${totalBreaks} breaks`);
  console.log(`  DESTINATIONS IN MAP: ${videoMapEntries.size}`);

  // ── Issues ──

  if (issues.length > 0) {
    console.log(`\n  ⚠️  ISSUES (${issues.length}):\n`);
    issues.forEach(i => console.log(`    • ${i}`));
  } else {
    console.log('\n  ✅ All videos properly wired!');
  }

  console.log();
}

function readVideoMapEntries() {
  const entries = new Set();
  const tsPath = path.join(DATA_DIR, 'destination-videos.ts');
  if (!fs.existsSync(tsPath)) return entries;

  const content = fs.readFileSync(tsPath, 'utf8');
  // Match both quoted ('slug':) and unquoted (slug:) keys pointing to /videos paths
  const re = /^\s*['"]?([a-z][\w-]*)['"]?\s*:\s*['"]\/videos/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    entries.add(m[1]);
  }
  return entries;
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════

function main() {
  const siteName = config.WATERMARK_TEXT || path.basename(config.PROJECT_ROOT);

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║   WIRE & DEPLOY VIDEOS — ${siteName.toUpperCase().padEnd(30)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (dryRun) console.log('  MODE: DRY RUN — no files will be modified\n');
  if (destFilter) console.log(`  FILTER: ${destFilter}\n`);

  // Scan disk
  const { heroes, previews, breaks } = scanVideos();
  const allFiles = [
    ...Object.values(heroes),
    ...Object.values(previews),
    ...Object.values(breaks).flat(),
  ];

  console.log(`  Videos on disk:`);
  console.log(`    Heroes:   ${Object.keys(heroes).length}`);
  console.log(`    Previews: ${Object.keys(previews).length}`);
  console.log(`    Breaks:   ${Object.values(breaks).reduce((s, a) => s + a.length, 0)}`);
  console.log();

  if (auditOnly) {
    runAudit(heroes, previews, breaks);
    return;
  }

  if (allFiles.length === 0) {
    console.log('  No processed videos found in public/videos/destinations/.');
    console.log('  Run Step 2 (batch process) first, or use --audit-only to check wiring.\n');
    return;
  }

  // Phase 1
  console.log('  1. Wiring heroVideo frontmatter...');
  const fmCount = wireHeroFrontmatter(heroes);
  console.log(`     ${fmCount} updated.\n`);

  // Phase 2
  console.log('  2. Wiring destination-videos.ts (card map)...');
  const mapCount = wireDestinationVideoMap(heroes, previews);
  console.log(`     ${mapCount} entries added.\n`);

  // Phase 3
  console.log('  3. Wiring inline immersive break videos...');
  const breakCount = wireInlineBreaks(breaks);
  console.log(`     ${breakCount} breaks wired.\n`);

  // Phase 4
  console.log('  4. Wiring relatedDestinations videoSrc...');
  const relCount = wireRelatedVideoSrc(heroes, previews);
  console.log(`     ${relCount} destinations updated.\n`);

  // Phase 5
  console.log('  5. Fixing broken static page hero videos...');
  const staticCount = wireStaticPages(heroes);
  console.log(`     ${staticCount} pages fixed.\n`);

  // Phase 5.5
  console.log('  5.5. Wiring pillar page & blog post videos...');
  const pillarCount = wirePillarPages(heroes);
  console.log(`     ${pillarCount} pages/posts wired.\n`);

  // Phase 6
  console.log('  6. Updating video-inventory.yaml...');
  const invCount = updateInventory(allFiles);
  console.log(`     ${invCount} inventory entries updated.\n`);

  if (dryRun) {
    console.log('  DRY RUN complete — no files were modified.\n');
    runAudit(heroes, previews, breaks);
    return;
  }

  // Build & Deploy
  if (!noDeploy) {
    const projectName = path.basename(config.PROJECT_ROOT);

    console.log('  7. Building with Astro...');
    try {
      execSync('npx astro build', {
        cwd: config.PROJECT_ROOT,
        stdio: 'inherit',
        timeout: 300000,
      });
      console.log('     ✅ Build complete.\n');
    } catch (err) {
      console.error('     ❌ Build failed. Fix errors before deploying.');
      runAudit(heroes, previews, breaks);
      return;
    }

    console.log('  8. Deploying to Cloudflare Pages...');
    try {
      execSync(`npx wrangler pages deploy dist --project-name=${projectName} --commit-dirty=true`, {
        cwd: config.PROJECT_ROOT,
        stdio: 'inherit',
        timeout: 300000,
      });
      console.log('     ✅ Deployed.\n');
    } catch (err) {
      console.error('     ❌ Deploy failed.');
    }
  }

  // Always run audit at the end
  runAudit(heroes, previews, breaks);

  console.log(`${'═'.repeat(60)}`);
  console.log('  WIRE & DEPLOY COMPLETE');
  console.log(`  heroVideo frontmatter: ${fmCount}`);
  console.log(`  destination-videos.ts: ${mapCount}`);
  console.log(`  inline breaks wired:   ${breakCount}`);
  console.log(`  related videoSrc:      ${relCount}`);
  console.log(`  static pages fixed:    ${staticCount}`);
  console.log(`  inventory updated:     ${invCount}`);
  if (!noDeploy && !dryRun) console.log('  Site built and deployed ✓');
  console.log(`${'═'.repeat(60)}\n`);
}

main();
