#!/usr/bin/env node
/**
 * translate.mjs — Batch translate English content to Tagalog AI drafts
 *
 * Usage:
 *   node scripts/translate.mjs                    # Translate all content
 *   node scripts/translate.mjs --file boracay     # Translate single file (by slug)
 *   node scripts/translate.mjs --dry-run          # Preview without writing
 *   node scripts/translate.mjs --force            # Overwrite existing translations
 *   node scripts/translate.mjs --collection destinations  # Only destinations
 *   node scripts/translate.mjs --collection blog          # Only blog posts
 */

import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import matter from 'gray-matter';
import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

function contentHash(text) {
  return crypto.createHash('md5').update(text || '').digest('hex').slice(0, 12);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flags = {
  file: null,
  dryRun: false,
  force: false,
  collection: null, // 'destinations' | 'blog' | null (both)
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    flags.file = args[++i];
  } else if (args[i] === '--dry-run') {
    flags.dryRun = true;
  } else if (args[i] === '--force') {
    flags.force = true;
  } else if (args[i] === '--collection' && args[i + 1]) {
    flags.collection = args[++i];
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: node scripts/translate.mjs [options]

Options:
  --file <slug>          Translate a single file by slug name (e.g., boracay)
  --dry-run              Preview what would be translated without writing files
  --force                Overwrite existing translation files
  --collection <name>    Only translate 'destinations' or 'blog'
  --help, -h             Show this help message
`);
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// Load API key
// ---------------------------------------------------------------------------
function loadApiKey() {
  // 1. Environment variable
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // 2. config.env file
  const configEnvPath = path.join(PROJECT_ROOT, 'video-tracking', 'pipeline', 'config.env');
  if (fs.existsSync(configEnvPath)) {
    const envContent = fs.readFileSync(configEnvPath, 'utf-8');
    const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match && match[1] && !match[1].includes('your_')) {
      return match[1].trim();
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Load glossary
// ---------------------------------------------------------------------------
function loadGlossary() {
  const glossaryPath = path.join(__dirname, 'glossary.json');
  if (fs.existsSync(glossaryPath)) {
    return JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));
  }
  console.warn('Warning: glossary.json not found at', glossaryPath);
  return {};
}

// ---------------------------------------------------------------------------
// Determine which frontmatter fields are translatable vs preserved
// ---------------------------------------------------------------------------
const TRANSLATABLE_FIELDS = new Set([
  'title',
  'description',
  'tagline',
  'gettingThere',
]);

const TRANSLATABLE_ESSENTIALS_FIELDS = new Set(['label', 'value']);

/**
 * Split frontmatter into translatable text and preserved data.
 * Returns { translatableText, preservedData, originalData }
 */
function splitFrontmatter(data) {
  const translatable = {};
  const preserved = {};

  for (const [key, value] of Object.entries(data)) {
    if (TRANSLATABLE_FIELDS.has(key) && typeof value === 'string' && value.length > 0) {
      translatable[key] = value;
    } else if (key === 'essentials' && Array.isArray(value)) {
      // Essentials have translatable label/value fields
      translatable.essentials = value.map(item => ({
        label: item.label || '',
        value: item.value || '',
      }));
      preserved.essentials_icons = value.map(item => item.icon || '');
    } else {
      preserved[key] = value;
    }
  }

  return { translatable, preserved, originalData: data };
}

/**
 * Build a structured prompt section from translatable frontmatter fields.
 */
function buildFrontmatterPrompt(translatable) {
  const lines = [];
  for (const [key, value] of Object.entries(translatable)) {
    if (key === 'essentials') {
      lines.push(`\n[ESSENTIALS]`);
      value.forEach((item, i) => {
        lines.push(`essentials[${i}].label: ${item.label}`);
        lines.push(`essentials[${i}].value: ${item.value}`);
      });
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

/**
 * Parse translated frontmatter fields from Claude's response.
 */
function parseTranslatedFrontmatter(responseText, originalTranslatable) {
  const result = {};

  // Extract frontmatter section
  const fmMatch = responseText.match(/\[TRANSLATED FRONTMATTER\]([\s\S]*?)\[\/TRANSLATED FRONTMATTER\]/);
  if (!fmMatch) return originalTranslatable; // fallback

  const fmText = fmMatch[1].trim();
  const lines = fmText.split('\n');

  const essentials = [];

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim();

    if (key.startsWith('essentials[')) {
      const idxMatch = key.match(/essentials\[(\d+)\]\.(\w+)/);
      if (idxMatch) {
        const idx = parseInt(idxMatch[1]);
        const field = idxMatch[2];
        if (!essentials[idx]) essentials[idx] = {};
        essentials[idx][field] = value;
      }
    } else if (TRANSLATABLE_FIELDS.has(key)) {
      result[key] = value;
    }
  }

  if (essentials.length > 0) {
    result.essentials = essentials;
  }

  return result;
}

/**
 * Extract translated body from Claude's response.
 */
function parseTranslatedBody(responseText) {
  const bodyMatch = responseText.match(/\[TRANSLATED BODY\]([\s\S]*?)\[\/TRANSLATED BODY\]/);
  if (!bodyMatch) {
    // Fallback: everything after frontmatter section (handles truncated responses)
    const afterFm = responseText.split('[/TRANSLATED FRONTMATTER]');
    if (afterFm.length > 1) {
      // Strip the [TRANSLATED BODY] opening tag if present
      return afterFm[1].replace(/\[TRANSLATED BODY\]/g, '').trim();
    }
    return responseText.replace(/\[TRANSLATED BODY\]/g, '').trim();
  }
  return bodyMatch[1].trim();
}

/**
 * Reconstruct full frontmatter from translated + preserved fields.
 */
function reconstructFrontmatter(translatedFields, preserved, essentialsIcons) {
  const result = {};

  // Start with preserved data (non-translatable fields)
  for (const [key, value] of Object.entries(preserved)) {
    if (key === 'essentials_icons') continue; // handled separately
    result[key] = value;
  }

  // Overlay translated fields
  for (const [key, value] of Object.entries(translatedFields)) {
    if (key === 'essentials' && Array.isArray(value)) {
      // Merge essentials with preserved icons
      result.essentials = value.map((item, i) => ({
        icon: essentialsIcons?.[i] || '',
        label: item.label || '',
        value: item.value || '',
      }));
    } else {
      result[key] = value;
    }
  }

  // Add translation metadata
  result.locale = 'tl';
  result.translation_status = 'ai_draft';

  return result;
}

// ---------------------------------------------------------------------------
// Build the system prompt for Claude
// ---------------------------------------------------------------------------
function buildSystemPrompt(glossary) {
  const doNotTranslate = glossary.do_not_translate || [];
  const brandTerms = glossary.brand || {};
  const travelTerms = glossary.travel_terms || {};
  const geoTerms = glossary.geography || {};
  const navTerms = glossary.navigation || {};
  const uiTerms = glossary.ui_labels || {};

  return `You are a professional Filipino/Tagalog translator specializing in travel content for the Philippines.

TASK: Translate the provided English travel content into natural, reader-friendly Tagalog (Filipino).

TRANSLATION GUIDELINES:
1. Use modern conversational Tagalog — the kind used in Philippine travel blogs and tourism websites, not formal/academic Filipino.
2. Keep the same first-person plural voice ("we discovered..." becomes "natuklasan namin...").
3. Maintain the same tone: warm, informative, practical, with personal storytelling.
4. Preserve all Markdown formatting exactly (headings, links, bold, lists, HTML blocks).
5. Preserve all HTML elements and CSS classes exactly as-is (e.g., <div class="scott-tips">, <strong>, etc.).
6. Keep all URLs, image paths, and link targets unchanged.
7. Keep all prices in their original format (both PHP and USD amounts).
8. Keep all proper nouns for places, hotels, restaurants, and landmarks in their original form.

DO NOT TRANSLATE these terms (keep in English):
${doNotTranslate.map(t => `- "${t}"`).join('\n')}

BRAND TERMS (keep exactly as shown):
${Object.entries(brandTerms).map(([en, tl]) => `- "${en}" -> "${tl}"`).join('\n')}

PREFERRED TRAVEL TERM TRANSLATIONS:
${Object.entries(travelTerms).map(([en, tl]) => `- "${en}" -> "${tl}"`).join('\n')}

GEOGRAPHY (keep original names):
${Object.entries(geoTerms).map(([en, tl]) => `- "${en}" -> "${tl}"`).join('\n')}

UI LABEL TRANSLATIONS:
${Object.entries(uiTerms).map(([en, tl]) => `- "${en}" -> "${tl}"`).join('\n')}

RESPONSE FORMAT:
You MUST structure your response exactly like this:

[TRANSLATED FRONTMATTER]
(translated frontmatter fields, one per line, in key: value format)
[/TRANSLATED FRONTMATTER]

[TRANSLATED BODY]
(translated Markdown body content)
[/TRANSLATED BODY]

Do NOT include any other text, explanations, or commentary outside these blocks.`;
}

// ---------------------------------------------------------------------------
// Translate a single file
// ---------------------------------------------------------------------------
async function translateFile(client, filePath, glossary, systemPrompt) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(raw);

  // Determine output path
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const outputDir = path.join(dir, 'tl');
  const outputPath = path.join(outputDir, basename);

  // Check if translation already exists
  if (!flags.force && await fs.pathExists(outputPath)) {
    console.log(`  SKIP (exists): ${relativePath} -> tl/${basename}`);
    return { skipped: true };
  }

  // Split frontmatter
  const { translatable, preserved } = splitFrontmatter(frontmatter);
  const essentialsIcons = preserved.essentials_icons || [];
  delete preserved.essentials_icons;

  // Build user prompt
  const frontmatterPrompt = buildFrontmatterPrompt(translatable);
  const wordCount = body.split(/\s+/).length;

  const userPrompt = `Translate the following English travel content to Tagalog.

SOURCE FILE: ${relativePath}

[FRONTMATTER TO TRANSLATE]
${frontmatterPrompt}
[/FRONTMATTER TO TRANSLATE]

[BODY TO TRANSLATE]
${body}
[/BODY TO TRANSLATE]`;

  if (flags.dryRun) {
    console.log(`  DRY RUN: ${relativePath}`);
    console.log(`    -> ${path.relative(PROJECT_ROOT, outputPath)}`);
    console.log(`    Words: ${wordCount}`);
    console.log(`    Translatable frontmatter fields: ${Object.keys(translatable).join(', ')}`);
    console.log(`    Preserved frontmatter fields: ${Object.keys(preserved).join(', ')}`);
    return { dryRun: true, wordCount };
  }

  // Call Claude API
  console.log(`  Translating: ${relativePath} (${wordCount} words)...`);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16384,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });

  const responseText = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Warn if response was truncated
  if (response.stop_reason === 'max_tokens') {
    console.warn(`  WARNING: Response truncated (hit max_tokens) for ${relativePath}. Output may be incomplete.`);
  }

  // Parse response
  const translatedFields = parseTranslatedFrontmatter(responseText, translatable);
  const translatedBody = parseTranslatedBody(responseText);

  // Add source_file reference and content hash for change detection
  preserved.source_file = relativePath.replace(/\\/g, '/');
  preserved.source_hash = contentHash(body);

  // Reconstruct full frontmatter
  const finalFrontmatter = reconstructFrontmatter(translatedFields, preserved, essentialsIcons);

  // Build output content
  const outputContent = matter.stringify(translatedBody, finalFrontmatter);

  // Write file
  await fs.ensureDir(outputDir);
  await fs.writeFile(outputPath, outputContent, 'utf-8');

  const outputWordCount = translatedBody.split(/\s+/).length;
  console.log(`  DONE: ${path.relative(PROJECT_ROOT, outputPath)} (${outputWordCount} words)`);

  return {
    inputWords: wordCount,
    outputWords: outputWordCount,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Discover Philippines — Tagalog Translation Script ===\n');

  // Load API key (not required for dry-run)
  const apiKey = loadApiKey();
  if (!apiKey && !flags.dryRun) {
    console.error('ERROR: ANTHROPIC_API_KEY not found.');
    console.error('Set it as an environment variable or in video-tracking/pipeline/config.env');
    process.exit(1);
  }

  // Initialize client (null for dry-run without key)
  const client = apiKey ? new Anthropic({ apiKey }) : null;

  // Load glossary
  const glossary = loadGlossary();
  const systemPrompt = buildSystemPrompt(glossary);

  // Find content files
  const collections = [];
  if (!flags.collection || flags.collection === 'destinations') {
    collections.push({
      name: 'destinations',
      pattern: path.join(PROJECT_ROOT, 'src', 'content', 'destinations', '*.md'),
    });
  }
  if (!flags.collection || flags.collection === 'blog') {
    collections.push({
      name: 'blog',
      pattern: path.join(PROJECT_ROOT, 'src', 'content', 'blog', '*.md'),
    });
  }

  let totalFiles = 0;
  let totalSkipped = 0;
  let totalWords = 0;
  let totalOutputWords = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const collection of collections) {
    // Use forward slashes for glob even on Windows
    const globPattern = collection.pattern.replace(/\\/g, '/');
    const files = await glob(globPattern);

    // Filter by --file flag if provided
    const filteredFiles = flags.file
      ? files.filter(f => {
          const slug = path.basename(f, '.md');
          return slug === flags.file;
        })
      : files;

    if (filteredFiles.length === 0) {
      if (flags.file) {
        console.log(`No file found matching slug "${flags.file}" in ${collection.name}`);
      }
      continue;
    }

    console.log(`\n--- ${collection.name} (${filteredFiles.length} files) ---\n`);

    for (const filePath of filteredFiles.sort()) {
      try {
        const result = await translateFile(client, filePath, glossary, systemPrompt);

        totalFiles++;
        if (result.skipped) {
          totalSkipped++;
        } else if (!result.dryRun) {
          totalWords += result.inputWords || 0;
          totalOutputWords += result.outputWords || 0;
          totalInputTokens += result.inputTokens || 0;
          totalOutputTokens += result.outputTokens || 0;
        } else {
          totalWords += result.wordCount || 0;
        }
      } catch (err) {
        console.error(`  ERROR translating ${path.basename(filePath)}: ${err.message}`);
      }
    }
  }

  // Summary
  console.log('\n=== Translation Summary ===');
  console.log(`Files processed: ${totalFiles}`);
  console.log(`Files skipped (existing): ${totalSkipped}`);
  console.log(`Total input words: ${totalWords.toLocaleString()}`);
  if (!flags.dryRun) {
    console.log(`Total output words: ${totalOutputWords.toLocaleString()}`);
    console.log(`API tokens used: ${totalInputTokens.toLocaleString()} input, ${totalOutputTokens.toLocaleString()} output`);
  }
  if (flags.dryRun) {
    console.log('\n(Dry run — no files were written)');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
