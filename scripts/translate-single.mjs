#!/usr/bin/env node
/**
 * translate-single.mjs — Translate a single content file to Tagalog
 *
 * Lightweight wrapper around translate.mjs that translates one file.
 *
 * Usage:
 *   node scripts/translate-single.mjs boracay                    # Translate destinations/boracay.md
 *   node scripts/translate-single.mjs boracay --dry-run           # Preview only
 *   node scripts/translate-single.mjs boracay --force             # Overwrite existing
 *   node scripts/translate-single.mjs boracay-20-years-ago        # Translate blog post by slug
 */

import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node scripts/translate-single.mjs <slug> [options]

Arguments:
  <slug>        The file slug to translate (e.g., boracay, cebu, boracay-20-years-ago)

Options:
  --dry-run     Preview without writing files
  --force       Overwrite existing translation
  --help, -h    Show this help message

Examples:
  node scripts/translate-single.mjs boracay
  node scripts/translate-single.mjs boracay --force
  node scripts/translate-single.mjs boracay-20-years-ago --dry-run
`);
  process.exit(args.length === 0 ? 1 : 0);
}

// Extract slug (first non-flag argument)
const slug = args.find(a => !a.startsWith('--'));
if (!slug) {
  console.error('ERROR: Please provide a file slug as the first argument.');
  process.exit(1);
}

// Pass through remaining flags
const passFlags = args.filter(a => a.startsWith('--'));

// Build command arguments for translate.mjs
const translateScript = path.join(__dirname, 'translate.mjs');
const cmdArgs = [translateScript, '--file', slug, ...passFlags];

console.log(`Translating: ${slug}\n`);

try {
  execFileSync('node', cmdArgs, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });
} catch (err) {
  // execFileSync already printed output via stdio: inherit
  process.exit(err.status || 1);
}
