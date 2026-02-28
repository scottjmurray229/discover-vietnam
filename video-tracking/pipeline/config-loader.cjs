/**
 * Loads config from config.env file
 */
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const envPath = path.join(__dirname, 'config.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: config.env not found.');
    console.error('Copy config.env.example to config.env and fill in your API keys.');
    process.exit(1);
  }

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const config = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    config[key.trim()] = rest.join('=').trim();
  }

  // Defaults
  config.PROJECT_ROOT = config.PROJECT_ROOT || path.join(__dirname, '..', '..');
  config.RAW_DOWNLOADS = config.RAW_DOWNLOADS || path.join(config.PROJECT_ROOT, 'raw-downloads');
  config.PUBLIC_VIDEOS = config.PUBLIC_VIDEOS || path.join(config.PROJECT_ROOT, 'public', 'videos', 'destinations');
  config.YOUTUBE_RAW = config.YOUTUBE_RAW || path.join(config.PROJECT_ROOT, 'youtube', 'raw');
  config.YOUTUBE_SCRIPTS = config.YOUTUBE_SCRIPTS || path.join(config.PROJECT_ROOT, 'youtube', 'scripts');
  config.YOUTUBE_AUDIO = config.YOUTUBE_AUDIO || path.join(config.PROJECT_ROOT, 'youtube', 'audio');
  config.YOUTUBE_EDITED = config.YOUTUBE_EDITED || path.join(config.PROJECT_ROOT, 'youtube', 'edited');
  config.INVENTORY_PATH = path.join(config.PROJECT_ROOT, 'video-tracking', 'video-inventory.yaml');

  return config;
}

module.exports = { loadConfig };
