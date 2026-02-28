#!/usr/bin/env node
/**
 * PIPELINE ORCHESTRATOR — Run steps sequentially
 *
 * Usage:
 *   node video-tracking/pipeline/run-pipeline.cjs              # Steps 1-3 (search, process, deploy)
 *   node video-tracking/pipeline/run-pipeline.cjs --all        # Steps 1-4 (includes YouTube upload)
 *   node video-tracking/pipeline/run-pipeline.cjs --produce    # Steps 1-3 + 2.5 (includes video production)
 *   node video-tracking/pipeline/run-pipeline.cjs --from 2     # Start from step 2
 *   node video-tracking/pipeline/run-pipeline.cjs --step 2.5   # Run single step (video production)
 *   node video-tracking/pipeline/run-pipeline.cjs --dest bohol # Filter to one destination
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const includeYT = args.includes('--all');
const includeProduce = args.includes('--produce');
const fromStep = args.includes('--from') ? parseFloat(args[args.indexOf('--from') + 1]) : 1;
const singleStep = args.includes('--step') ? parseFloat(args[args.indexOf('--step') + 1]) : null;
const destFilter = args.includes('--dest') ? args[args.indexOf('--dest') + 1] : null;
const dryRun = args.includes('--dry-run');

const PIPELINE_DIR = __dirname;

const steps = [
  {
    num: 1,
    name: 'Sweep Downloads',
    script: '1-sweep-downloads.cjs',
    interactive: true,
    desc: 'Sweep ~/Downloads/ for new clips, rename & organize',
  },
  {
    num: 2,
    name: 'Batch Process',
    script: '2-batch-process.cjs',
    interactive: false,
    desc: 'FFmpeg compress for web, generate previews',
  },
  {
    num: 2.5,
    name: 'Produce YouTube Videos',
    script: '2.5-produce-youtube.cjs',
    interactive: false,
    desc: 'Generate script, synthesize voice, render video (requires API keys)',
    optIn: true, // Only runs with --produce or --all or --step 2.5
  },
  {
    num: 3,
    name: 'Deploy Videos',
    script: '3-deploy-videos.cjs',
    interactive: false,
    desc: 'Update frontmatter, videoMap, build & deploy to Cloudflare',
  },
  {
    num: 4,
    name: 'YouTube Upload',
    script: '4-youtube-upload.cjs',
    interactive: true,
    desc: 'Upload edited videos to YouTube with metadata',
  },
];

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   VIDEO PIPELINE                                         ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const maxStep = includeYT ? 4 : 3;
const stepsToRun = singleStep
  ? steps.filter(s => s.num === singleStep)
  : steps.filter(s => {
      if (s.num < fromStep || s.num > maxStep) return false;
      // Opt-in steps only run with explicit flags
      if (s.optIn && !includeProduce && !includeYT) return false;
      return true;
    });

console.log('  Steps to run:');
stepsToRun.forEach(s => {
  console.log(`    ${s.num}. ${s.name} — ${s.desc}`);
});
if (destFilter) console.log(`\n  Destination filter: ${destFilter}`);
if (dryRun) console.log('  Mode: DRY RUN');
console.log();

for (const step of stepsToRun) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`  STEP ${step.num}: ${step.name.toUpperCase()}`);
  console.log(`${'━'.repeat(60)}\n`);

  const scriptPath = path.join(PIPELINE_DIR, step.script);
  const extraArgs = [];
  if (destFilter) extraArgs.push('--dest', destFilter);
  if (dryRun) extraArgs.push('--dry-run');

  if (step.interactive) {
    // Interactive steps need stdio: inherit for readline
    try {
      execSync(`node "${scriptPath}" ${extraArgs.join(' ')}`, {
        stdio: 'inherit',
        cwd: path.join(PIPELINE_DIR, '..', '..'),
        timeout: 3600000, // 1 hour for downloads
      });
    } catch (err) {
      if (err.status) {
        console.error(`\n  Step ${step.num} exited with code ${err.status}`);
        const cont = step.num < maxStep;
        if (cont) {
          console.log('  Continuing to next step...');
        }
      }
    }
  } else {
    try {
      execSync(`node "${scriptPath}" ${extraArgs.join(' ')}`, {
        stdio: 'inherit',
        cwd: path.join(PIPELINE_DIR, '..', '..'),
        timeout: 600000, // 10 min for processing/deploy
      });
    } catch (err) {
      console.error(`\n  Step ${step.num} failed: ${err.message?.slice(0, 100)}`);
      if (step.num < maxStep) {
        console.log('  Stopping pipeline.');
        process.exit(1);
      }
    }
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log('  PIPELINE COMPLETE');
console.log(`${'═'.repeat(60)}\n`);
