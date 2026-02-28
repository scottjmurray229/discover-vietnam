#!/usr/bin/env node
/**
 * STEP 4: Upload destination videos to YouTube with metadata
 *
 * Reads edited videos from youtube/edited/, uploads with title, description,
 * tags, and playlist assignment using YouTube Data API v3.
 *
 * SETUP REQUIRED:
 *   1. Go to https://console.cloud.google.com
 *   2. Create project "Discover Philippines"
 *   3. Enable "YouTube Data API v3"
 *   4. Create OAuth 2.0 credentials (type: Desktop app)
 *   5. Download the JSON, save as video-tracking/pipeline/client_secret.json
 *   6. Run this script once — it will open a browser for auth
 *   7. Token is saved locally for future runs
 *
 * Usage:
 *   node video-tracking/pipeline/4-youtube-upload.cjs                     # Upload all in youtube/edited/
 *   node video-tracking/pipeline/4-youtube-upload.cjs --file dest-boracay-guide-2026.mp4
 *   node video-tracking/pipeline/4-youtube-upload.cjs --dry-run           # Preview metadata only
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { loadConfig } = require('./config-loader.cjs');

const config = loadConfig();

const args = process.argv.slice(2);
const fileFilter = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
const dryRun = args.includes('--dry-run');

const EDITED_DIR = path.join(config.PROJECT_ROOT, 'youtube', 'edited');
const THUMBS_DIR = path.join(config.PROJECT_ROOT, 'youtube', 'thumbnails');
const TOKEN_PATH = path.join(__dirname, 'youtube-token.json');
const CLIENT_SECRET_PATH = path.join(__dirname, 'client_secret.json');

// Destination metadata for video descriptions
const DEST_DATA = {};
try {
  const yaml = require('js-yaml');
  const destDir = path.join(config.PROJECT_ROOT, 'src', 'content', 'destinations');
  for (const file of fs.readdirSync(destDir).filter(f => f.endsWith('.md'))) {
    const slug = file.replace('.md', '');
    const content = fs.readFileSync(path.join(destDir, file), 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = yaml.load(fmMatch[1]);
      DEST_DATA[slug] = {
        title: fm.title,
        description: fm.description,
        region: fm.region,
        tagline: fm.tagline,
      };
    }
  }
} catch (e) {
  console.warn('Warning: Could not load destination data:', e.message);
}

// Video metadata templates
function generateMetadata(filename) {
  // Parse filename: dest-boracay-guide-2026.mp4
  const match = filename.match(/^(dest|pillar|short|demo)-(.+?)(?:-guide|-top\d+)?-(\d{4})\.mp4$/);
  if (!match) return null;

  const [, type, slug, year] = match;
  const dest = DEST_DATA[slug];
  const title = dest?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (type === 'dest') {
    return {
      title: `${title} Philippines Travel Guide ${year} | Real Prices & Honest Tips`,
      description: generateDestDescription(slug, title, year),
      tags: generateDestTags(slug, title, dest),
      categoryId: '19', // Travel & Events
      privacyStatus: 'private', // Set to private first, review before publishing
      playlist: `${dest?.region || 'philippines'}-destinations`,
    };
  }

  if (type === 'pillar') {
    return {
      title: `${title} — Philippines ${year}`,
      description: `${title}\n\nFull guide: https://discoverphilippines.com/${slug}/`,
      tags: [`Philippines ${slug}`, 'Philippines travel', `Philippines ${year}`],
      categoryId: '19',
      privacyStatus: 'private',
      playlist: 'travel-tips',
    };
  }

  if (type === 'short') {
    return {
      title: `${title} Philippines 🇵🇭 #shorts`,
      description: `${title} — Full guide: https://discoverphilippines.com/destinations/${slug}/`,
      tags: [`${title} Philippines`, 'Philippines travel', 'shorts'],
      categoryId: '19',
      privacyStatus: 'private',
      playlist: 'shorts',
    };
  }

  return {
    title: filename.replace('.mp4', ''),
    description: '',
    tags: ['Philippines travel'],
    categoryId: '19',
    privacyStatus: 'private',
  };
}

function generateDestDescription(slug, title, year) {
  return `Complete travel guide to ${title}, Philippines — with real prices, how to get there, where to eat, where to stay, and what most tourists miss.

We've been traveling to the Philippines for 20+ years. Jenice is Filipina, Scott handles logistics. No sponsored content.

📖 FULL WRITTEN GUIDE: https://discoverphilippines.com/destinations/${slug}/
📱 TRIP COMPANION (works offline): https://discoverphilippines.com/companion/
🆓 FREE BETA ACCESS: https://discoverphilippines.com/founding-explorer/

#Philippines #${title.replace(/\s+/g, '')} #PhilippinesTravel #TravelGuide${year}`;
}

function generateDestTags(slug, title, dest) {
  const tags = [
    `${title} Philippines`,
    `${title} travel guide`,
    `Philippines ${new Date().getFullYear()}`,
    `${title} things to do`,
    `where to stay ${title}`,
    'Philippines travel',
    'Philippines food',
    'Philippines budget travel',
    'Philippines tips',
  ];
  if (dest?.region) tags.push(`${dest.region} Philippines`);
  return tags.slice(0, 15); // YouTube max 15 tags
}

// OAuth2 flow for YouTube API
async function getAuthToken() {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    console.error('Error: client_secret.json not found.');
    console.error('Download OAuth credentials from Google Cloud Console');
    console.error(`and save to: ${CLIENT_SECRET_PATH}`);
    process.exit(1);
  }

  // Check for saved token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    // Check if expired
    if (token.expiry_date && token.expiry_date > Date.now()) {
      return token;
    }
    // Try refresh
    if (token.refresh_token) {
      const clientData = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, 'utf8'));
      const client = clientData.installed || clientData.web;
      const refreshed = await refreshToken(client, token.refresh_token);
      if (refreshed) {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(refreshed, null, 2));
        return refreshed;
      }
    }
  }

  // Full OAuth flow
  const clientData = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, 'utf8'));
  const client = clientData.installed || clientData.web;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${client.client_id}` +
    `&redirect_uri=urn:ietf:wg:oauth:2.0:oob` +
    `&response_type=code` +
    `&scope=https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube` +
    `&access_type=offline`;

  console.log('\nOpen this URL in your browser to authorize:\n');
  console.log(authUrl);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => rl.question('Enter the authorization code: ', resolve));
  rl.close();

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(`OAuth error: ${tokenData.error_description}`);
  }

  tokenData.expiry_date = Date.now() + (tokenData.expires_in * 1000);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  return tokenData;
}

async function refreshToken(client, refreshToken) {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: client.client_id,
        client_secret: client.client_secret,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    if (data.error) return null;
    data.refresh_token = refreshToken;
    data.expiry_date = Date.now() + (data.expires_in * 1000);
    return data;
  } catch {
    return null;
  }
}

// Upload video to YouTube using resumable upload
async function uploadVideo(filePath, metadata, token) {
  const fileSize = fs.statSync(filePath).size;
  const fileName = path.basename(filePath);

  // Step 1: Initiate resumable upload
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': fileSize,
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify({
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: metadata.categoryId,
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en',
        },
        status: {
          privacyStatus: metadata.privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Upload init failed (${initRes.status}): ${err}`);
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('No upload URL returned');

  // Step 2: Upload the file
  const fileBuffer = fs.readFileSync(filePath);
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize,
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${err}`);
  }

  const videoData = await uploadRes.json();
  return videoData;
}

// Upload thumbnail
async function uploadThumbnail(videoId, thumbPath, token) {
  if (!fs.existsSync(thumbPath)) return null;

  const thumbBuffer = fs.readFileSync(thumbPath);
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'image/jpeg',
      },
      body: thumbBuffer,
    }
  );

  return res.ok;
}

// Main
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   YOUTUBE UPLOAD — DISCOVER PHILIPPINES                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(EDITED_DIR)) {
    console.log('No youtube/edited/ directory. Create edited videos first.');
    return;
  }

  let files = fs.readdirSync(EDITED_DIR).filter(f => f.endsWith('.mp4'));
  if (fileFilter) files = files.filter(f => f === fileFilter);

  console.log(`Videos to upload: ${files.length}`);
  if (dryRun) console.log('DRY RUN — showing metadata only\n');
  console.log();

  if (files.length === 0) {
    console.log('No videos found in youtube/edited/');
    return;
  }

  // Auth (skip for dry run)
  let token = null;
  if (!dryRun) {
    console.log('Authenticating with YouTube...');
    token = await getAuthToken();
    console.log('✅ Authenticated\n');
  }

  for (const file of files) {
    const metadata = generateMetadata(file);
    if (!metadata) {
      console.log(`  ⚠️  ${file} — could not parse filename, skipping`);
      continue;
    }

    console.log(`  📹 ${file}`);
    console.log(`     Title: ${metadata.title}`);
    console.log(`     Tags: ${metadata.tags.slice(0, 5).join(', ')}...`);
    console.log(`     Privacy: ${metadata.privacyStatus}`);

    if (dryRun) {
      console.log(`     Description preview: ${metadata.description.slice(0, 100)}...`);
      console.log();
      continue;
    }

    const filePath = path.join(EDITED_DIR, file);
    const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
    console.log(`     Size: ${fileSize} MB — uploading...`);

    try {
      const result = await uploadVideo(filePath, metadata, token);
      const videoId = result.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`     ✅ Uploaded: ${videoUrl}`);

      // Try to upload thumbnail
      const thumbPath = path.join(THUMBS_DIR, file.replace('.mp4', '.jpg'));
      if (fs.existsSync(thumbPath)) {
        const thumbOk = await uploadThumbnail(videoId, thumbPath, token);
        console.log(`     ${thumbOk ? '✅' : '⚠️'} Thumbnail ${thumbOk ? 'set' : 'failed'}`);
      }
    } catch (err) {
      console.log(`     ❌ Error: ${err.message}`);
    }

    console.log();
  }

  console.log('Done. Videos uploaded as PRIVATE — review and publish manually on YouTube Studio.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
