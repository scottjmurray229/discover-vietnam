/**
 * Generates narration scripts for destination YouTube Shorts using Claude API.
 * Output: ~60-word script saved to youtube/scripts/{slug}.txt
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

/**
 * Generate a narration script for a destination Short
 * @param {object} dest - Destination data from destination-loader
 * @param {object} options
 * @param {string} options.apiKey - Anthropic API key
 * @param {string} options.outputDir - Directory for script files
 * @param {boolean} [options.force=false] - Regenerate even if cached
 * @returns {Promise<string>} Path to the generated script file
 */
export async function generateScript(dest, { apiKey, outputDir, force = false }) {
  const outputPath = path.join(outputDir, `${dest.slug}.txt`);

  // Check cache
  if (!force && fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Script cached: ${dest.slug}`);
    return outputPath;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const highlightNames = dest.highlights.slice(0, 3).map(h => h.title).join(', ');
  const budget = `$${dest.budgetPerDay.backpacker}–$${dest.budgetPerDay.luxury}/day`;

  const prompt = `Write a 60-word narration script for a 30-second YouTube Short about ${dest.title}, Philippines.

Destination data:
- Tagline: "${dest.tagline}"
- Region: ${dest.region}
- Budget: ${budget}
- Top highlights: ${highlightNames}

Script requirements:
1. Hook (1 sentence) — grab attention, mention the destination name
2. Highlights (2-3 sentences) — mention the top activities/attractions by name
3. CTA (1 sentence) — direct viewers to discoverphilippines.info and subscribe

Voice: Warm, enthusiastic, conversational. First-person plural ("we discovered..."). No filler words.
Format: Plain text, no headings or labels. Just the narration script as spoken words.
IMPORTANT: Keep it under 60 words — this is a 30-second Short.
IMPORTANT: Write ALL numbers and dollar amounts as full words for text-to-speech. Say "thirty dollars" not "$30". Say "one hundred fifty dollars" not "$150". Say "discover philippines dot info" not "discoverphilippines.info".`;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const script = response.content[0].text.trim();
  fs.writeFileSync(outputPath, script, 'utf8');
  console.log(`  ✅ Script generated: ${dest.slug} (${script.split(/\s+/).length} words)`);

  return outputPath;
}
