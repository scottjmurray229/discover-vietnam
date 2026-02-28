// Content Freshness Audit Script
// Run with: node scripts/freshness-audit.mjs
//
// Scans all destination and blog markdown files, checks the lastVerified
// frontmatter field, and flags pages overdue for refresh (>90 days).
// Outputs a formatted report to console and to test-results/freshness-report.md.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, relative } from 'path';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const STALE_THRESHOLD_DAYS = 90;
const TODAY = new Date();

// ---------------------------------------------------------------------------
// Minimal frontmatter parser (no npm dependencies)
// ---------------------------------------------------------------------------
function parseFrontmatter(content) {
  // Normalize all line endings (including corrupt \r\r\n) to \n
  const normalized = content.replace(/\r+\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const fm = {};

  for (const line of yaml.split('\n')) {
    // Only parse top-level scalar key: value lines (skip arrays, nested objects)
    const kv = line.match(/^([a-zA-Z_]\w*)\s*:\s*(.+)$/);
    if (kv) {
      const key = kv[1].trim();
      let value = kv[2].trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fm[key] = value;
    }
  }

  return fm;
}

// ---------------------------------------------------------------------------
// Collect markdown files from a directory (non-recursive, .md only)
// ---------------------------------------------------------------------------
function collectMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => join(dir, f));
}

// ---------------------------------------------------------------------------
// Compute days between two dates
// ---------------------------------------------------------------------------
function daysBetween(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateB - dateA) / msPerDay);
}

// ---------------------------------------------------------------------------
// Main audit logic
// ---------------------------------------------------------------------------
function runAudit() {
  const destinationsDir = join(PROJECT_ROOT, 'src', 'content', 'destinations');
  const blogDir = join(PROJECT_ROOT, 'src', 'content', 'blog');

  const files = [
    ...collectMarkdownFiles(destinationsDir).map(f => ({ path: f, collection: 'destinations' })),
    ...collectMarkdownFiles(blogDir).map(f => ({ path: f, collection: 'blog' })),
  ];

  const results = {
    total: files.length,
    upToDate: [],
    stale: [],
    missing: [],
  };

  for (const file of files) {
    const content = readFileSync(file.path, 'utf-8');
    const fm = parseFrontmatter(content);
    const relPath = relative(PROJECT_ROOT, file.path).replace(/\\/g, '/');

    const entry = {
      file: relPath,
      collection: file.collection,
      title: fm.title || '(untitled)',
      contentStatus: fm.contentStatus || (fm.draft === 'true' ? 'draft' : '(not set)'),
      draft: fm.draft,
      lastVerified: fm.lastVerified || null,
      daysSince: null,
    };

    if (!fm.lastVerified) {
      results.missing.push(entry);
      continue;
    }

    const verifiedDate = new Date(fm.lastVerified);
    if (isNaN(verifiedDate.getTime())) {
      // Invalid date format — treat as missing
      entry.lastVerified = fm.lastVerified + ' (invalid date)';
      results.missing.push(entry);
      continue;
    }

    entry.daysSince = daysBetween(verifiedDate, TODAY);

    if (entry.daysSince > STALE_THRESHOLD_DAYS) {
      results.stale.push(entry);
    } else {
      results.upToDate.push(entry);
    }
  }

  // Sort stale pages by staleness (most overdue first)
  results.stale.sort((a, b) => b.daysSince - a.daysSince);
  // Sort missing by collection then title
  results.missing.sort((a, b) => a.collection.localeCompare(b.collection) || a.title.localeCompare(b.title));
  // Sort up-to-date by days since (closest to expiry first)
  results.upToDate.sort((a, b) => b.daysSince - a.daysSince);

  return results;
}

// ---------------------------------------------------------------------------
// Format console output
// ---------------------------------------------------------------------------
function formatConsoleReport(results) {
  const lines = [];
  const divider = '='.repeat(72);
  const thinDivider = '-'.repeat(72);

  lines.push('');
  lines.push(divider);
  lines.push('  CONTENT FRESHNESS AUDIT');
  lines.push(`  Date: ${TODAY.toISOString().split('T')[0]}  |  Threshold: ${STALE_THRESHOLD_DAYS} days`);
  lines.push(divider);
  lines.push('');

  // Summary
  lines.push(`  Total pages scanned:      ${results.total}`);
  lines.push(`  Up-to-date (< 90 days):   ${results.upToDate.length}`);
  lines.push(`  Needs refresh (> 90 days): ${results.stale.length}`);
  lines.push(`  Missing lastVerified:      ${results.missing.length}`);
  lines.push('');

  // Stale pages
  if (results.stale.length > 0) {
    lines.push(thinDivider);
    lines.push('  PAGES NEEDING REFRESH (sorted by staleness)');
    lines.push(thinDivider);
    for (const entry of results.stale) {
      lines.push(`  ${entry.file}`);
      lines.push(`    Title:          ${entry.title}`);
      lines.push(`    Last Verified:  ${entry.lastVerified}`);
      lines.push(`    Days Overdue:   ${entry.daysSince} days (${entry.daysSince - STALE_THRESHOLD_DAYS} past threshold)`);
      lines.push(`    Status:         ${entry.contentStatus}`);
      lines.push('');
    }
  }

  // Missing lastVerified
  if (results.missing.length > 0) {
    lines.push(thinDivider);
    lines.push('  PAGES MISSING lastVerified FIELD');
    lines.push(thinDivider);
    for (const entry of results.missing) {
      lines.push(`  ${entry.file}`);
      lines.push(`    Title:   ${entry.title}`);
      lines.push(`    Status:  ${entry.contentStatus}`);
      lines.push('');
    }
  }

  // Up-to-date summary
  if (results.upToDate.length > 0) {
    lines.push(thinDivider);
    lines.push('  UP-TO-DATE PAGES (closest to expiry first)');
    lines.push(thinDivider);
    for (const entry of results.upToDate) {
      const remaining = STALE_THRESHOLD_DAYS - entry.daysSince;
      lines.push(`  ${entry.file.padEnd(52)} ${entry.daysSince}d ago  (${remaining}d remaining)`);
    }
    lines.push('');
  }

  lines.push(divider);
  lines.push(`  Report saved to: test-results/freshness-report.md`);
  lines.push(divider);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Format markdown report
// ---------------------------------------------------------------------------
function formatMarkdownReport(results) {
  const lines = [];

  lines.push('# Content Freshness Audit Report');
  lines.push('');
  lines.push(`**Date:** ${TODAY.toISOString().split('T')[0]}  `);
  lines.push(`**Threshold:** ${STALE_THRESHOLD_DAYS} days  `);
  lines.push(`**Generated by:** \`node scripts/freshness-audit.mjs\``);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total pages scanned | ${results.total} |`);
  lines.push(`| Up-to-date (within ${STALE_THRESHOLD_DAYS} days) | ${results.upToDate.length} |`);
  lines.push(`| Needs refresh (older than ${STALE_THRESHOLD_DAYS} days) | ${results.stale.length} |`);
  lines.push(`| Missing lastVerified field | ${results.missing.length} |`);
  lines.push('');

  // Stale pages
  if (results.stale.length > 0) {
    lines.push('## Pages Needing Refresh');
    lines.push('');
    lines.push('Sorted by staleness (most overdue first).');
    lines.push('');
    lines.push('| File | Title | Last Verified | Days Since | Overdue By | Status |');
    lines.push('|------|-------|---------------|------------|------------|--------|');
    for (const entry of results.stale) {
      const overdue = entry.daysSince - STALE_THRESHOLD_DAYS;
      lines.push(`| \`${entry.file}\` | ${entry.title} | ${entry.lastVerified} | ${entry.daysSince} | ${overdue} days | ${entry.contentStatus} |`);
    }
    lines.push('');
  } else {
    lines.push('## Pages Needing Refresh');
    lines.push('');
    lines.push('None -- all pages with lastVerified are within the 90-day threshold.');
    lines.push('');
  }

  // Missing lastVerified
  if (results.missing.length > 0) {
    lines.push('## Pages Missing lastVerified');
    lines.push('');
    lines.push('These pages have no `lastVerified` date in frontmatter and cannot be tracked for freshness.');
    lines.push('');
    lines.push('| File | Title | Collection | Status |');
    lines.push('|------|-------|------------|--------|');
    for (const entry of results.missing) {
      lines.push(`| \`${entry.file}\` | ${entry.title} | ${entry.collection} | ${entry.contentStatus} |`);
    }
    lines.push('');
  }

  // Up-to-date pages
  if (results.upToDate.length > 0) {
    lines.push('## Up-to-Date Pages');
    lines.push('');
    lines.push('Sorted by closest to expiry first.');
    lines.push('');
    lines.push('| File | Title | Last Verified | Days Since | Days Remaining |');
    lines.push('|------|-------|---------------|------------|----------------|');
    for (const entry of results.upToDate) {
      const remaining = STALE_THRESHOLD_DAYS - entry.daysSince;
      lines.push(`| \`${entry.file}\` | ${entry.title} | ${entry.lastVerified} | ${entry.daysSince} | ${remaining} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const results = runAudit();

// Console output
console.log(formatConsoleReport(results));

// Write markdown report
const outputDir = join(PROJECT_ROOT, 'test-results');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}
const reportPath = join(outputDir, 'freshness-report.md');
writeFileSync(reportPath, formatMarkdownReport(results), 'utf-8');

// Exit with code 1 if there are stale pages (useful for CI)
if (results.stale.length > 0) {
  process.exit(1);
}
