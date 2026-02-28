/**
 * Synthesizes narration audio using ElevenLabs TTS API.
 * Output: MP3 file saved to youtube/audio/{slug}-narration.mp3
 */
import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import path from 'path';

/**
 * Synthesize voice narration from a script
 * @param {string} slug - Destination slug
 * @param {string} scriptPath - Path to narration script text file
 * @param {object} options
 * @param {string} options.apiKey - ElevenLabs API key
 * @param {string} options.voiceId - ElevenLabs voice ID (cloned voice)
 * @param {string} options.outputDir - Directory for audio files
 * @param {boolean} [options.force=false] - Regenerate even if cached
 * @returns {Promise<string>} Path to the generated audio file
 */
export async function synthesizeVoice(slug, scriptPath, { apiKey, voiceId, outputDir, force = false }) {
  const outputPath = path.join(outputDir, `${slug}-narration.mp3`);

  // Check cache
  if (!force && fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Audio cached: ${slug}`);
    return outputPath;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const script = fs.readFileSync(scriptPath, 'utf8').trim();
  if (!script) {
    throw new Error(`Empty script file: ${scriptPath}`);
  }

  console.log(`  🎙️  Synthesizing voice for ${slug} (${script.length} chars)...`);

  const client = new ElevenLabsClient({ apiKey });

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: script,
    model_id: 'eleven_multilingual_v2',
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    },
  });

  // Stream response to file
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, buffer);

  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`  ✅ Audio synthesized: ${slug} (${sizeMB} MB)`);

  return outputPath;
}
