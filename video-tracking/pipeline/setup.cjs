#!/usr/bin/env node
/**
 * One-time setup — creates config.env from the example template.
 * Run: node video-tracking/pipeline/setup.cjs
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const example = path.join(dir, 'config.env.example');
const config = path.join(dir, 'config.env');

if (fs.existsSync(config)) {
  console.log('config.env already exists. Nothing to do.');
  process.exit(0);
}

if (!fs.existsSync(example)) {
  console.error('config.env.example not found. Something is wrong with the pipeline install.');
  process.exit(1);
}

fs.copyFileSync(example, config);
console.log('Created config.env from template.');
console.log('Edit video-tracking/pipeline/config.env with your API keys before running steps 2.5 or 4.');
