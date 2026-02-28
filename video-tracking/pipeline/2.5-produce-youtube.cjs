#!/usr/bin/env node
/**
 * STEP 2.5: Automated YouTube Video Production
 *
 * Takes raw Shutterstock clips and produces finished 30-second narrated
 * YouTube Shorts with animated text overlays, ready for upload.
 *
 * Pipeline: Load destination data → Generate script (Claude) → Synthesize voice
 *           (ElevenLabs) → Render video (Remotion) → Output to youtube/edited/
 *
 * REQUIREMENTS:
 *   - ANTHROPIC_API_KEY in config.env (Claude API for script generation)
 *   - ELEVENLABS_API_KEY in config.env (ElevenLabs TTS)
 *   - ELEVENLABS_VOICE_ID in config.env (cloned voice ID)
 *   - Raw video clips in youtube/raw/ (from Step 1)
 *
 * Usage:
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs                    # Process all with raw clips
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --dest boracay     # Single destination
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --limit 5          # First 5 only
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --dry-run          # Preview without API calls
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --force-all        # Regenerate everything
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --force-script     # Regenerate scripts only
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --force-audio      # Regenerate audio only
 *   node video-tracking/pipeline/2.5-produce-youtube.cjs --force-render     # Re-render videos only
 */

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config-loader.cjs');
const { loadDestination, loadAllDestinations } = require('./lib/destination-loader.cjs');

const config = loadConfig();

// CLI args
const args = process.argv.slice(2);
const destFilter = args.includes('--dest') ? args[args.indexOf('--dest') + 1] : null;
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 0;
const dryRun = args.includes('--dry-run');
const forceAll = args.includes('--force-all');
const forceScript = forceAll || args.includes('--force-script');
const forceAudio = forceAll || args.includes('--force-audio');
const forceRender = forceAll || args.includes('--force-render');

// Directories
const YOUTUBE_RAW = config.YOUTUBE_RAW || path.join(config.PROJECT_ROOT, 'youtube', 'raw');
const YOUTUBE_SCRIPTS = config.YOUTUBE_SCRIPTS || path.join(config.PROJECT_ROOT, 'youtube', 'scripts');
const YOUTUBE_AUDIO = config.YOUTUBE_AUDIO || path.join(config.PROJECT_ROOT, 'youtube', 'audio');
const YOUTUBE_EDITED = config.YOUTUBE_EDITED || path.join(config.PROJECT_ROOT, 'youtube', 'edited');

// API keys
const ANTHROPIC_API_KEY = config.ANTHROPIC_API_KEY;
const ELEVENLABS_API_KEY = config.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = config.ELEVENLABS_VOICE_ID;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   STEP 2.5: PRODUCE YOUTUBE VIDEOS — DISCOVER PH        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Validate API keys (unless dry run)
if (!dryRun) {
  const missing = [];
  if (!ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!ELEVENLABS_API_KEY) missing.push('ELEVENLABS_API_KEY');
  if (!ELEVENLABS_VOICE_ID) missing.push('ELEVENLABS_VOICE_ID');
  if (missing.length > 0) {
    console.error(`❌ Missing required config keys: ${missing.join(', ')}`);
    console.error('   Add them to video-tracking/pipeline/config.env');
    process.exit(1);
  }
}

async function main() {
  // Find raw clips to process
  let rawFiles = [];
  if (destFilter) {
    // Single destination mode — check for raw clip
    const rawClip = path.join(YOUTUBE_RAW, `${destFilter}-hero-full.mp4`);
    if (fs.existsSync(rawClip)) {
      rawFiles.push({ slug: destFilter, videoPath: rawClip });
    } else {
      // Allow production without a raw clip (gradient-only background)
      console.log(`  ⚠️  No raw clip found for ${destFilter}, will use gradient-only background`);
      rawFiles.push({ slug: destFilter, videoPath: '' });
    }
  } else {
    // Scan youtube/raw/ for hero clips
    if (fs.existsSync(YOUTUBE_RAW)) {
      const files = fs.readdirSync(YOUTUBE_RAW).filter(f => f.endsWith('-hero-full.mp4'));
      rawFiles = files.map(f => ({
        slug: f.replace('-hero-full.mp4', ''),
        videoPath: path.join(YOUTUBE_RAW, f),
      }));
    }

    if (rawFiles.length === 0) {
      console.log('  No raw clips found in youtube/raw/');
      console.log('  Run Step 1 first, or use --dest <slug> to produce without a background clip.');
      return;
    }
  }

  if (limit > 0) rawFiles = rawFiles.slice(0, limit);

  console.log(`  Destinations to process: ${rawFiles.length}`);
  rawFiles.forEach(f => console.log(`    - ${f.slug}${f.videoPath ? '' : ' (no raw clip)'}`));
  if (dryRun) console.log('\n  Mode: DRY RUN (no API calls, no rendering)');
  if (forceAll) console.log('  Force: regenerate all steps');
  console.log();

  // Load ESM modules dynamically only when needed (CJS → ESM bridge)
  // These modules import @remotion/bundler etc. which are in the remotion project's node_modules
  let generateScript, synthesizeVoice, bundleProject, renderDestination, stopFileServer;
  if (!dryRun) {
    ({ generateScript } = await import('./lib/script-generator.mjs'));
    ({ synthesizeVoice } = await import('./lib/voice-synthesizer.mjs'));
    ({ bundleProject, renderDestination, stopFileServer } = await import('./lib/video-renderer.mjs'));

    // Bundle Remotion project once before the loop
    await bundleProject();
  }

  // Process each destination
  const results = [];
  for (const { slug, videoPath } of rawFiles) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  Processing: ${slug}`);
    console.log(`${'─'.repeat(50)}`);

    try {
      // 1. Load destination data
      const dest = loadDestination(config.PROJECT_ROOT, slug);
      if (!dest) {
        console.log(`  ⚠️  No destination page found for ${slug}, skipping`);
        results.push({ slug, status: 'skipped', reason: 'no destination data' });
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY RUN] Would generate script for "${dest.title}"`);
        console.log(`  [DRY RUN] Would synthesize voice narration`);
        console.log(`  [DRY RUN] Would render 30s Short (1080x1920, 30fps)`);
        const year = new Date().getFullYear();
        console.log(`  [DRY RUN] Output: youtube/edited/short-${slug}-${year}.mp4`);
        results.push({ slug, status: 'dry-run' });
        continue;
      }

      // 2. Generate narration script
      console.log('\n  Step A: Script generation');
      const scriptPath = await generateScript(dest, {
        apiKey: ANTHROPIC_API_KEY,
        outputDir: YOUTUBE_SCRIPTS,
        force: forceScript,
      });

      // 3. Synthesize voice
      console.log('\n  Step B: Voice synthesis');
      const audioPath = await synthesizeVoice(slug, scriptPath, {
        apiKey: ELEVENLABS_API_KEY,
        voiceId: ELEVENLABS_VOICE_ID,
        outputDir: YOUTUBE_AUDIO,
        force: forceAudio,
      });

      // 4. Render video
      console.log('\n  Step C: Video rendering');
      const outputPath = await renderDestination(dest, {
        videoSrc: videoPath,
        audioSrc: audioPath,
        outputDir: YOUTUBE_EDITED,
        force: forceRender,
      });

      results.push({ slug, status: 'success', output: outputPath });
    } catch (err) {
      console.error(`  ❌ Error processing ${slug}: ${err.message.slice(0, 200)}`);
      results.push({ slug, status: 'error', error: err.message.slice(0, 200) });
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  STEP 2.5 COMPLETE');
  const success = results.filter(r => r.status === 'success').length;
  const skipped = results.filter(r => r.status === 'skipped' || r.status === 'dry-run').length;
  const errors = results.filter(r => r.status === 'error').length;
  console.log(`  ✅ Success: ${success}  ⏭️  Skipped: ${skipped}  ❌ Errors: ${errors}`);

  if (errors > 0) {
    console.log('\n  Failed destinations:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`    - ${r.slug}: ${r.error}`);
    });
  }

  console.log(`${'═'.repeat(60)}\n`);

  // Clean up file server
  if (stopFileServer) stopFileServer();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
