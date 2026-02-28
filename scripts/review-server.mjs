#!/usr/bin/env node
/**
 * review-server.mjs — Side-by-side translation review tool
 *
 * LOCAL mode (default):
 *   node scripts/review-server.mjs            # Start on port 3000
 *   node scripts/review-server.mjs --port 8080
 *
 * RAILWAY / REMOTE mode (set env vars):
 *   GITHUB_TOKEN=ghp_xxx GITHUB_REPO=user/repo REVIEW_PASSWORD=secret
 *   Reads/writes via GitHub API so Adrin can edit from the Philippines.
 *   Saves create commits directly in the repo.
 *
 * Env vars:
 *   GITHUB_TOKEN    — GitHub personal access token (enables remote mode)
 *   GITHUB_REPO     — e.g. "scottmurray/discover-philippines"
 *   GITHUB_BRANCH   — branch to read/write (default: master)
 *   REVIEW_PASSWORD  — HTTP Basic Auth password (recommended for remote)
 *   NOTIFY_WEBHOOK  — Slack/Discord webhook URL for "finalized" notifications
 *   PORT            — server port (Railway sets this automatically)
 */

import http from 'http';
import crypto from 'crypto';
import matter from 'gray-matter';

const TRANSLATABLE_FIELDS = ['title', 'description', 'tagline', 'gettingThere'];

function contentHash(text) {
  return crypto.createHash('md5').update(text || '').digest('hex').slice(0, 12);
}

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'master';
const REVIEW_PASSWORD = process.env.REVIEW_PASSWORD;
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK;
const IS_REMOTE = !!(GITHUB_TOKEN && GITHUB_REPO);

// Form-based auth credentials
const AUTH_USER = process.env.AUTH_USER || 'discoverphilippines';
const AUTH_PASS = process.env.AUTH_PASS || 'masangcay';
const sessions = new Set();

// CLI args (local mode)
const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx !== -1
  ? parseInt(args[portIdx + 1], 10)
  : (parseInt(process.env.PORT) || 3000);

const COLLECTIONS = [
  { name: 'destinations', relDir: 'src/content/destinations' },
  { name: 'blog', relDir: 'src/content/blog' },
];

// ---------------------------------------------------------------------------
// Storage abstraction — local filesystem vs GitHub API
// ---------------------------------------------------------------------------

let storage;

if (IS_REMOTE) {
  // GitHub API storage
  async function ghApi(endpoint, options = {}) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'translation-review-server',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  storage = {
    async listDir(relDir) {
      try {
        const data = await ghApi(`/contents/${relDir}?ref=${GITHUB_BRANCH}`);
        return data
          .filter(f => f.type === 'file' && f.name.endsWith('.md'))
          .map(f => f.name);
      } catch {
        return [];
      }
    },

    async readFile(relPath) {
      const data = await ghApi(`/contents/${relPath}?ref=${GITHUB_BRANCH}`);
      return Buffer.from(data.content, 'base64').toString('utf-8');
    },

    async fileExists(relPath) {
      try {
        await ghApi(`/contents/${relPath}?ref=${GITHUB_BRANCH}`);
        return true;
      } catch {
        return false;
      }
    },

    async writeFile(relPath, content, commitMessage) {
      // Get existing SHA for update
      let sha;
      try {
        const existing = await ghApi(`/contents/${relPath}?ref=${GITHUB_BRANCH}`);
        sha = existing.sha;
      } catch {
        // File doesn't exist — will create
      }

      const body = {
        message: commitMessage || `Review: update ${relPath}`,
        content: Buffer.from(content).toString('base64'),
        branch: GITHUB_BRANCH,
      };
      if (sha) body.sha = sha;

      await ghApi(`/contents/${relPath}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
  };
} else {
  // Local filesystem storage
  const fs = await import('fs-extra');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.default.dirname(__filename);
  const PROJECT_ROOT = path.default.resolve(__dirname, '..');

  function absPath(relPath) {
    return path.default.join(PROJECT_ROOT, relPath);
  }

  storage = {
    async listDir(relDir) {
      const abs = absPath(relDir);
      if (!await fs.default.pathExists(abs)) return [];
      return (await fs.default.readdir(abs)).filter(f => f.endsWith('.md'));
    },

    async readFile(relPath) {
      return fs.default.readFile(absPath(relPath), 'utf-8');
    },

    async fileExists(relPath) {
      return fs.default.pathExists(absPath(relPath));
    },

    async writeFile(relPath, content) {
      const abs = absPath(relPath);
      await fs.default.ensureDir(path.default.dirname(abs));
      await fs.default.writeFile(abs, content, 'utf-8');
    },
  };
}

// ---------------------------------------------------------------------------
// Business logic (uses storage abstraction)
// ---------------------------------------------------------------------------

async function getTranslationPairs() {
  const pairs = [];

  for (const col of COLLECTIONS) {
    const enDir = col.relDir;
    const tlDir = `${col.relDir}/tl`;

    const enFiles = await storage.listDir(enDir);
    const tlFiles = new Set(await storage.listDir(tlDir));

    for (const file of enFiles) {
      const slug = file.replace('.md', '');
      const hasTl = tlFiles.has(file);

      let status = 'untranslated';
      let reviewedDate = null;
      let contentChanged = false;
      if (hasTl) {
        try {
          const tlRaw = await storage.readFile(`${tlDir}/${file}`);
          const { data: tlData } = matter(tlRaw);
          status = tlData.translation_status || 'ai_draft';
          reviewedDate = tlData.reviewed_date || null;

          // Check if English content changed since last translation/review
          if (tlData.source_hash) {
            const enRaw = await storage.readFile(`${enDir}/${file}`);
            const { content: enBody } = matter(enRaw);
            const currentHash = contentHash(enBody);
            if (currentHash !== tlData.source_hash) {
              contentChanged = true;
              if (status === 'human_reviewed' || status === 'published') {
                status = 'content_changed';
              }
            }
          }
        } catch {
          status = 'ai_draft';
        }
      }

      pairs.push({
        slug,
        collection: col.name,
        hasTranslation: hasTl,
        status,
        reviewedDate,
        contentChanged,
      });
    }
  }

  const order = { content_changed: 0, ai_draft: 1, in_review: 2, human_reviewed: 3, untranslated: 4, published: 5 };
  pairs.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.slug.localeCompare(b.slug));
  return pairs;
}

async function getTranslationPair(collection, slug) {
  const col = COLLECTIONS.find(c => c.name === collection);
  if (!col) return null;

  const enPath = `${col.relDir}/${slug}.md`;
  if (!await storage.fileExists(enPath)) return null;

  const enRaw = await storage.readFile(enPath);
  const en = matter(enRaw);

  const tlPath = `${col.relDir}/tl/${slug}.md`;
  const hasTl = await storage.fileExists(tlPath);

  let tl = null;
  if (hasTl) {
    const tlRaw = await storage.readFile(tlPath);
    tl = matter(tlRaw);
  }

  return {
    slug,
    collection,
    english: { frontmatter: en.data, body: en.content },
    tagalog: tl ? { frontmatter: tl.data, body: tl.content } : null,
  };
}

async function saveTranslation(collection, slug, updates) {
  const col = COLLECTIONS.find(c => c.name === collection);
  if (!col) throw new Error(`Unknown collection: ${collection}`);

  const tlPath = `${col.relDir}/tl/${slug}.md`;
  if (!await storage.fileExists(tlPath)) throw new Error(`No Tagalog file exists for ${slug}`);

  const raw = await storage.readFile(tlPath);
  const { data: existingFm } = matter(raw);

  // Update only translatable fields + essentials
  for (const field of TRANSLATABLE_FIELDS) {
    if (updates.frontmatter && updates.frontmatter[field] !== undefined) {
      existingFm[field] = updates.frontmatter[field];
    }
  }

  if (updates.frontmatter?.essentials && Array.isArray(updates.frontmatter.essentials)) {
    existingFm.essentials = updates.frontmatter.essentials;
  }

  // Status: 'draft' saves as in_review, 'final' saves as human_reviewed
  const action = updates.action || 'final';
  existingFm.translation_status = action === 'draft' ? 'in_review' : 'human_reviewed';
  if (action === 'final') {
    existingFm.reviewed_date = new Date().toISOString().split('T')[0];
  }

  // Store hash of current English content for change detection
  const enPath = `${col.relDir}/${slug}.md`;
  try {
    const enRaw = await storage.readFile(enPath);
    const { content: enBody } = matter(enRaw);
    existingFm.source_hash = contentHash(enBody);
  } catch { /* ignore if English file missing */ }

  const output = matter.stringify(updates.body ?? '', existingFm);
  const label = action === 'draft' ? 'draft' : 'FINALIZED';
  const commitMsg = `translation: ${label} ${slug} (${collection})`;
  await storage.writeFile(tlPath, output, commitMsg);

  // Send notification on finalize
  if (action === 'final') {
    await sendNotification(collection, slug);
  }

  return { success: true, path: tlPath, action };
}

async function sendNotification(collection, slug) {
  if (!NOTIFY_WEBHOOK) return;

  const message = `Translation finalized: **${slug}** (${collection})`;
  try {
    await fetch(NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Slack format
        text: message.replace(/\*\*/g, '*'),
        // Discord format
        content: message,
      }),
    });
    console.log(`  Notification sent for ${slug}`);
  } catch (e) {
    console.error(`  Notification failed for ${slug}:`, e.message);
  }
}

// ---------------------------------------------------------------------------
// Auth middleware (cookie-based sessions)
// ---------------------------------------------------------------------------

function getSessionFromCookie(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/dp_review_session=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function checkAuth(req, res) {
  // Remote mode can still use REVIEW_PASSWORD via Basic Auth as fallback
  if (IS_REMOTE && REVIEW_PASSWORD) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Basic ')) {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString();
      const pass = decoded.includes(':') ? decoded.split(':').slice(1).join(':') : decoded;
      if (pass === REVIEW_PASSWORD) return true;
    }
  }

  const token = getSessionFromCookie(req);
  if (token && sessions.has(token)) return true;

  return false;
}

function handleLogin(req, res, body) {
  if (body.username === AUTH_USER && body.password === AUTH_PASS) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.add(token);
    res.writeHead(302, {
      'Set-Cookie': `dp_review_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      'Location': '/',
    });
    res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getLoginHTML('Mali ang username o password. Subukan muli.'));
  }
}

function handleLogout(req, res) {
  const token = getSessionFromCookie(req);
  if (token) sessions.delete(token);
  res.writeHead(302, {
    'Set-Cookie': 'dp_review_session=; Path=/; HttpOnly; Max-Age=0',
    'Location': '/login',
  });
  res.end();
}

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Login page — always accessible
  if (req.method === 'GET' && pathname === '/login') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getLoginHTML());
    return;
  }

  // Login form submission
  if (req.method === 'POST' && pathname === '/login') {
    const body = await parseBody(req);
    return handleLogin(req, res, body);
  }

  // Logout
  if (req.method === 'GET' && pathname === '/logout') {
    return handleLogout(req, res);
  }

  // Auth check — redirect to login if not authenticated
  if (!checkAuth(req, res)) {
    res.writeHead(302, { 'Location': '/login' });
    res.end();
    return;
  }

  // API: list all translation pairs
  if (req.method === 'GET' && pathname === '/api/translations') {
    const pairs = await getTranslationPairs();
    return json(res, pairs);
  }

  // API: get a single translation pair
  const getMatch = pathname.match(/^\/api\/translation\/([^/]+)\/([^/]+)$/);
  if (req.method === 'GET' && getMatch) {
    const [, collection, slug] = getMatch;
    const pair = await getTranslationPair(collection, slug);
    if (!pair) return json(res, { error: 'Not found' }, 404);
    return json(res, pair);
  }

  // API: save a translation
  if (req.method === 'POST' && getMatch) {
    const [, collection, slug] = getMatch;
    try {
      const body = await parseBody(req);
      const result = await saveTranslation(collection, slug, body);
      return json(res, result);
    } catch (e) {
      return json(res, { error: e.message }, 400);
    }
  }

  // Serve HTML UI
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHTML());
    return;
  }

  json(res, { error: 'Not found' }, 404);
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (e) {
    console.error('Server error:', e);
    json(res, { error: e.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n  Translation Review Server`);
  console.log(`  ────────────────────────`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Mode: ${IS_REMOTE ? 'GitHub API (remote)' : 'Local filesystem'}`);
  if (IS_REMOTE) console.log(`  Repo: ${GITHUB_REPO} (${GITHUB_BRANCH})`);
  console.log(`  Auth: login required (${AUTH_USER})`);
  if (NOTIFY_WEBHOOK) console.log(`  Notifications: webhook configured`);
  console.log(`  Press Ctrl+C to stop\n`);
});

// ---------------------------------------------------------------------------
// Login / Splash Page
// ---------------------------------------------------------------------------

function getLoginHTML(errorMsg = '') {
  return `<!DOCTYPE html>
<html lang="tl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Translation Review — Login | Discover Philippines</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(165deg, #141C26 0%, #0c3547 30%, #0D7377 55%, #0c3547 75%, #141C26 100%);
    color: white;
    padding: 24px;
  }
  .splash {
    max-width: 520px;
    width: 100%;
    text-align: center;
  }
  .splash-logo {
    font-size: 2.5rem;
    margin-bottom: 8px;
  }
  .splash-title {
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 700;
    margin-bottom: 6px;
    line-height: 1.2;
  }
  .splash-subtitle {
    font-size: 0.95rem;
    color: rgba(255,255,255,0.6);
    margin-bottom: 32px;
    font-weight: 300;
  }
  .instructions {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 24px 28px;
    text-align: left;
    margin-bottom: 32px;
  }
  .instructions h2 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #14B8A6;
    margin-bottom: 14px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .instructions ol {
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .instructions li {
    font-size: 0.88rem;
    color: rgba(255,255,255,0.75);
    line-height: 1.65;
  }
  .instructions li strong {
    color: rgba(255,255,255,0.95);
    font-weight: 600;
  }
  .instructions li em {
    color: #14B8A6;
    font-style: normal;
    font-weight: 500;
  }
  .keyboard-hints {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .keyboard-hints kbd {
    display: inline-block;
    padding: 1px 6px;
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.75rem;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
  }
  .login-box {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 28px;
  }
  .login-box h3 {
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .form-field {
    margin-bottom: 14px;
  }
  .form-field label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .form-field input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    background: rgba(255,255,255,0.06);
    color: white;
    font-size: 0.95rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-field input::placeholder { color: rgba(255,255,255,0.25); }
  .form-field input:focus {
    border-color: #14B8A6;
    box-shadow: 0 0 0 2px rgba(20,184,166,0.2);
  }
  .login-btn {
    width: 100%;
    padding: 12px;
    background: #0D7377;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-top: 4px;
  }
  .login-btn:hover { background: #095456; }
  .login-btn:active { transform: scale(0.98); }
  .error-msg {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.3);
    color: #fca5a5;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.85rem;
    margin-bottom: 16px;
    text-align: center;
  }
  .footer-note {
    margin-top: 24px;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.3);
  }
</style>
</head>
<body>
<div class="splash">
  <div class="splash-logo">\u{1F1F5}\u{1F1ED}</div>
  <h1 class="splash-title">Translation Review Tool</h1>
  <p class="splash-subtitle">Discover Philippines &mdash; Tagalog Translation System</p>

  <div class="instructions">
    <h2>Paano Gamitin ang Tool na Ito</h2>
    <ol>
      <li><strong>Pumili ng page</strong> mula sa dropdown o i-click sa list &mdash; makikita mo ang English sa kaliwa at Tagalog sa kanan.</li>
      <li><strong>I-edit ang Tagalog text</strong> sa right side. Yung English ay read-only para reference lang. Hindi kailangan i-translate word-for-word &mdash; <em>Taglish style</em> ang target natin.</li>
      <li>I-translate din ang <strong>frontmatter fields</strong> sa taas (title, description, tagline) at ang <strong>Quick Facts / Essentials</strong> kung meron.</li>
      <li>Kapag gusto mo muna i-save pero hindi pa tapos, i-click ang <strong>"Save Draft"</strong>. Kapag done ka na, i-click ang <strong>"Mark Complete"</strong> para ma-notify si Scott.</li>
      <li>Ang mga section na <em>HTML-only</em> (video breaks, pro tips) ay naka-hide na &mdash; hindi na kailangan i-translate yun.</li>
    </ol>
    <div class="keyboard-hints">
      <span><kbd>Ctrl</kbd>+<kbd>S</kbd> &mdash; Quick save ng draft</span>
      <span><kbd>Alt</kbd>+<kbd>\u2190</kbd> / <kbd>Alt</kbd>+<kbd>\u2192</kbd> &mdash; Previous / next na page</span>
    </div>
  </div>

  <div class="login-box">
    <h3>Mag-login para makapasok</h3>
    ${errorMsg ? '<div class="error-msg">' + errorMsg + '</div>' : ''}
    <form method="POST" action="/login">
      <div class="form-field">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Username" autocomplete="username" required autofocus>
      </div>
      <div class="form-field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Password" autocomplete="current-password" required>
      </div>
      <button type="submit" class="login-btn">Mag-login</button>
    </form>
  </div>

  <p class="footer-note">Discover Philippines Translation System &copy; 2026</p>
</div>

<script>
  // Submit as JSON so parseBody can handle it
  document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;
    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
      redirect: 'follow',
    }).then(function(res) {
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        return res.text().then(function(html) {
          document.open();
          document.write(html);
          document.close();
        });
      }
    });
  });
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// HTML UI
// ---------------------------------------------------------------------------

function getHTML() {
  const modeLabel = IS_REMOTE ? 'Remote (GitHub)' : 'Local';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Translation Review — Discover Philippines</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #f8f9fa;
    color: #1a2332;
    line-height: 1.5;
  }

  /* Header */
  .header {
    background: #0d7377;
    color: white;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    flex-wrap: wrap;
  }
  .header h1 { font-size: 18px; font-weight: 600; white-space: nowrap; }
  .header select {
    padding: 6px 12px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    background: rgba(255,255,255,0.15);
    color: white;
    font-size: 14px;
    min-width: 200px;
    cursor: pointer;
  }
  .header select option { color: #1a2332; background: white; }

  .mode-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(255,255,255,0.2);
    white-space: nowrap;
  }

  .status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .status-ai_draft { background: #fbbf24; color: #78350f; }
  .status-in_review { background: #fb923c; color: #7c2d12; }
  .status-human_reviewed { background: #34d399; color: #065f46; }
  .status-published { background: #60a5fa; color: #1e3a5f; }
  .status-untranslated { background: #d1d5db; color: #4b5563; }
  .status-content_changed { background: #f87171; color: #7f1d1d; }

  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn {
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-nav {
    background: rgba(255,255,255,0.2);
    color: white;
  }
  .btn-nav:hover:not(:disabled) { background: rgba(255,255,255,0.3); }
  .btn-draft {
    background: rgba(255,255,255,0.25);
    color: white;
    padding: 8px 16px;
    font-size: 14px;
  }
  .btn-draft:hover:not(:disabled) { background: rgba(255,255,255,0.35); }
  .btn-save {
    background: #e8654a;
    color: white;
    padding: 8px 20px;
    font-size: 15px;
  }
  .btn-save:hover:not(:disabled) { background: #d4553b; }

  .save-feedback {
    font-size: 13px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    display: none;
  }
  .save-feedback.success { display: inline-block; background: #d1fae5; color: #065f46; }
  .save-feedback.error { display: inline-block; background: #fee2e2; color: #991b1b; }

  /* Landing — translation list */
  .landing {
    max-width: 900px;
    margin: 40px auto;
    padding: 0 24px;
  }
  .landing h2 { font-size: 24px; margin-bottom: 8px; }
  .landing p.sub { color: #64748b; margin-bottom: 24px; }

  .translation-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .translation-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: background 0.15s;
    gap: 12px;
  }
  .translation-item:hover { background: #f8fafc; }
  .translation-item:last-child { border-bottom: none; }
  .translation-item .slug { font-weight: 600; flex: 1; }
  .translation-item .collection { color: #94a3b8; font-size: 13px; }

  /* Frontmatter fields bar */
  .fm-bar {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 24px;
  }
  .fm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 24px;
    max-width: 1600px;
    margin: 0 auto;
  }
  .fm-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .fm-field input, .fm-field textarea {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    line-height: 1.4;
    resize: vertical;
  }
  .fm-field input:read-only, .fm-field textarea:read-only {
    background: #f8fafc;
    color: #64748b;
    border-color: #f1f5f9;
  }
  .fm-field input:focus, .fm-field textarea:focus {
    outline: none;
    border-color: #0d7377;
    box-shadow: 0 0 0 2px rgba(13,115,119,0.15);
  }
  .fm-pair { display: contents; }

  /* Essentials section */
  .essentials-bar {
    background: #fafbfc;
    border-bottom: 1px solid #e2e8f0;
    padding: 12px 24px;
  }
  .essentials-bar h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 10px;
  }
  .essentials-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    max-width: 1600px;
    margin: 0 auto;
  }
  .essential-row {
    display: grid;
    grid-template-columns: 30px 1fr;
    gap: 6px;
    align-items: start;
    padding: 6px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .essential-row .icon { font-size: 18px; text-align: center; padding-top: 2px; }
  .essential-row .fields { display: flex; flex-direction: column; gap: 4px; }
  .essential-row input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
  }
  .essential-row input:read-only {
    background: #f8fafc;
    color: #64748b;
    border-color: #f1f5f9;
  }
  .essential-row input:focus {
    outline: none;
    border-color: #0d7377;
    box-shadow: 0 0 0 2px rgba(13,115,119,0.15);
  }

  /* Section-based editor */
  .section-headers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: sticky;
    top: 56px;
    z-index: 50;
  }
  .section-header-en {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #f1f5f9;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }
  .section-header-tl {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #ecfdf5;
    color: #065f46;
    border-bottom: 1px solid #e2e8f0;
  }

  .section-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 2px solid #e2e8f0;
  }
  .section-row:last-child { border-bottom: none; }

  .section-label {
    grid-column: 1 / -1;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #0d7377;
    background: #e8f4f5;
    border-bottom: 1px solid #d1e7e8;
  }

  .section-en, .section-tl {
    padding: 0;
  }
  .section-en textarea, .section-tl textarea {
    width: 100%;
    padding: 14px 20px;
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.75;
    resize: vertical;
    min-height: 80px;
    border-right: 1px solid #e2e8f0;
  }
  .section-en textarea {
    background: #f8fafc;
    color: #475569;
  }
  .section-tl textarea {
    background: #fff;
    color: #1a2332;
  }
  .section-tl textarea:focus {
    outline: none;
    background: #fffff8;
    box-shadow: inset 0 0 0 2px rgba(13,115,119,0.15);
  }

  /* Tracker dashboard */
  .tracker {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .tracker-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    text-align: center;
  }
  .tracker-card .number {
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;
  }
  .tracker-card .peso {
    font-size: 14px;
    font-weight: 600;
    margin-top: 2px;
    opacity: 0.7;
  }
  .tracker-card .label {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
    font-weight: 500;
  }
  .tracker-card.needs-review .number { color: #d97706; }
  .tracker-card.complete .number { color: #059669; }
  .tracker-card.not-started .number { color: #94a3b8; }
  .tracker-card.total .number { color: #0d7377; }
  .tracker-card.changed .number { color: #ef4444; }
  .tracker-card.changed { border-left: 3px solid #ef4444; }

  .payment-bar {
    background: white;
    border-radius: 12px;
    padding: 16px 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .payment-section {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .payment-section .amount {
    font-size: 24px;
    font-weight: 800;
    color: #059669;
  }
  .payment-section .detail {
    font-size: 13px;
    color: #64748b;
  }
  .payment-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
    margin-bottom: 2px;
  }

  .progress-bar-wrap {
    background: #e2e8f0;
    border-radius: 100px;
    height: 8px;
    margin-bottom: 24px;
    overflow: hidden;
    display: flex;
  }
  .progress-segment-complete { background: #34d399; }
  .progress-segment-review { background: #fbbf24; }
  .progress-segment-draft { background: #fb923c; }

  /* Loading / empty states */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #94a3b8;
    font-size: 16px;
  }

  .no-translation {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #94a3b8;
    font-size: 15px;
    flex-direction: column;
    gap: 8px;
  }
  .no-translation strong { color: #64748b; }

  /* Stats bar */
  .stats {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #64748b;
  }
  .stat .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .dot-ai_draft { background: #fbbf24; }
  .dot-in_review { background: #fb923c; }
  .dot-human_reviewed { background: #34d399; }
  .dot-untranslated { background: #d1d5db; }
  .dot-content_changed { background: #f87171; }

  .keyboard-hint {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
  }
  kbd {
    display: inline-block;
    padding: 1px 5px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 3px;
    font-size: 11px;
    font-family: inherit;
    background: rgba(255,255,255,0.1);
  }
</style>
</head>
<body>

<div class="header">
  <h1 style="cursor:pointer" onclick="showLanding()" title="Back to queue">Translation Review</h1>
  <span class="mode-badge">${modeLabel}</span>
  <select id="slugSelect">
    <option value="">Loading...</option>
  </select>
  <span id="statusBadge" class="status-badge" style="display:none"></span>
  <div class="header-actions">
    <button class="btn btn-nav" onclick="showLanding()" style="font-size:12px;padding:4px 10px;opacity:0.7">Home</button>
    <a href="/logout" class="btn btn-nav" style="text-decoration:none;font-size:12px;padding:4px 10px;opacity:0.7">Logout</a>
    <span class="keyboard-hint"><kbd>Ctrl</kbd>+<kbd>S</kbd> draft &nbsp; <kbd>Alt</kbd>+<kbd>&larr;</kbd><kbd>&rarr;</kbd> nav</span>
    <button class="btn btn-nav" id="prevBtn" disabled>&larr; Prev</button>
    <button class="btn btn-nav" id="nextBtn" disabled>Next &rarr;</button>
    <button class="btn btn-draft" id="draftBtn" disabled>Save Draft</button>
    <button class="btn btn-save" id="saveBtn" disabled>Mark Complete</button>
    <span class="save-feedback" id="saveFeedback"></span>
  </div>
</div>

<div id="landing" class="landing">
  <div id="trackerDashboard"></div>
  <div id="progressBar" class="progress-bar-wrap"></div>
  <h2>Translation Queue</h2>
  <p class="sub">Select a destination above or click one below to start reviewing.</p>
  <div id="translationList" class="translation-list">
    <div class="loading">Loading translations...</div>
  </div>
</div>

<div id="editorView" style="display:none">
  <div id="fmBar" class="fm-bar" style="display:none">
    <div class="fm-grid" id="fmGrid"></div>
  </div>
  <div id="essentialsBar" class="essentials-bar" style="display:none">
    <h3>Quick Facts / Essentials</h3>
    <div class="essentials-grid" id="essentialsGrid"></div>
  </div>
  <div id="editorPanels">
    <div class="section-headers">
      <div class="section-header-en">English (Source)</div>
      <div class="section-header-tl">Tagalog (Editable)</div>
    </div>
    <div id="sectionsContainer"></div>
  </div>
</div>

<script>
  const TRANSLATABLE = ${JSON.stringify(TRANSLATABLE_FIELDS)};

  let allPairs = [];
  let currentPair = null;
  let currentData = null;
  let dirty = false;

  const $ = id => document.getElementById(id);

  function showLanding() {
    if (dirty && !confirm('You have unsaved changes. Discard?')) return;
    $('landing').style.display = '';
    $('editorView').style.display = 'none';
    $('statusBadge').style.display = 'none';
    $('slugSelect').value = '';
    location.hash = '';
    currentPair = null;
    currentData = null;
    dirty = false;
    renderList();
  }

  async function init() {
    const res = await fetch('/api/translations');
    allPairs = await res.json();
    renderList();
    populateSelect();

    if (location.hash) {
      const [collection, slug] = location.hash.slice(1).split('/');
      if (collection && slug) loadTranslation(collection, slug);
    }
  }

  var RATE_PER_PAGE = 250;

  function renderList() {
    var list = $('translationList');

    var counts = { content_changed: 0, ai_draft: 0, in_review: 0, human_reviewed: 0, untranslated: 0, published: 0 };
    allPairs.forEach(function(p) { counts[p.status] = (counts[p.status] || 0) + 1; });

    var totalPages = allPairs.length;
    var changed = counts.content_changed;
    var needsReview = counts.ai_draft + counts.in_review;
    var complete = counts.human_reviewed + counts.published;
    var notStarted = counts.untranslated;

    var now = new Date();
    var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var monthComplete = allPairs.filter(function(p) {
      return (p.status === 'human_reviewed' || p.status === 'published') && p.reviewedDate && p.reviewedDate.startsWith(currentMonth);
    }).length;
    var allTimeTotal = complete * RATE_PER_PAGE;
    var monthTotal = monthComplete * RATE_PER_PAGE;

    var monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    var pendingPeso = (needsReview + notStarted + changed) * RATE_PER_PAGE;
    var totalPeso = totalPages * RATE_PER_PAGE;

    $('trackerDashboard').innerHTML = ''
      + '<div class="tracker">'
      + (changed > 0 ? '<div class="tracker-card changed"><div class="number">' + changed + '</div><div class="peso">\\u20B1' + (changed * RATE_PER_PAGE).toLocaleString() + '</div><div class="label">Content Changed</div></div>' : '')
      + '<div class="tracker-card needs-review"><div class="number">' + needsReview + '</div><div class="peso">\\u20B1' + (needsReview * RATE_PER_PAGE).toLocaleString() + '</div><div class="label">Needs Review</div></div>'
      + '<div class="tracker-card complete"><div class="number">' + complete + '</div><div class="peso">\\u20B1' + allTimeTotal.toLocaleString() + '</div><div class="label">Earned</div></div>'
      + '<div class="tracker-card not-started"><div class="number">' + notStarted + '</div><div class="peso">\\u20B1' + (notStarted * RATE_PER_PAGE).toLocaleString() + '</div><div class="label">Not Started</div></div>'
      + '<div class="tracker-card total"><div class="number">' + totalPages + '</div><div class="peso">\\u20B1' + totalPeso.toLocaleString() + '</div><div class="label">Total Potential</div></div>'
      + '</div>'
      + '<div class="payment-bar">'
      + '<div><div class="payment-label">' + monthName + '</div>'
      + '<div class="payment-section"><span class="amount">\\u20B1' + monthTotal.toLocaleString() + '</span><span class="detail">' + monthComplete + ' pages @ \\u20B1' + RATE_PER_PAGE + '/page</span></div></div>'
      + '<div><div class="payment-label">All Time</div>'
      + '<div class="payment-section"><span class="amount">\\u20B1' + allTimeTotal.toLocaleString() + '</span><span class="detail">' + complete + ' pages complete</span></div></div>'
      + '</div>';

    var pctComplete = totalPages > 0 ? (complete / totalPages * 100) : 0;
    var pctReview = totalPages > 0 ? (needsReview / totalPages * 100) : 0;
    var pctChanged = totalPages > 0 ? (changed / totalPages * 100) : 0;
    $('progressBar').innerHTML = ''
      + '<div class="progress-segment-complete" style="width:' + pctComplete + '%"></div>'
      + '<div class="progress-segment-review" style="width:' + pctReview + '%"></div>'
      + (pctChanged > 0 ? '<div style="width:' + pctChanged + '%;background:#f87171"></div>' : '');

    const translated = allPairs.filter(p => p.hasTranslation);
    const untranslated = allPairs.filter(p => !p.hasTranslation);

    let html = '';

    translated.forEach(p => {
      html += '<div class="translation-item" data-collection="' + p.collection + '" data-slug="' + p.slug + '">'
        + '<span class="slug">' + p.slug + '</span>'
        + '<span class="collection">' + p.collection + '</span>'
        + '<span class="status-badge status-' + p.status + '">' + p.status.replace('_', ' ') + '</span>'
        + '</div>';
    });

    if (untranslated.length) {
      html += '<div style="padding:10px 20px;color:#94a3b8;font-size:13px;font-weight:600;text-transform:uppercase;background:#f8fafc;border-bottom:1px solid #f1f5f9">Not Yet Translated</div>';
      untranslated.forEach(p => {
        html += '<div class="translation-item" data-collection="' + p.collection + '" data-slug="' + p.slug + '" style="opacity:0.5">'
          + '<span class="slug">' + p.slug + '</span>'
          + '<span class="collection">' + p.collection + '</span>'
          + '<span class="status-badge status-untranslated">untranslated</span>'
          + '</div>';
      });
    }

    list.innerHTML = html;

    list.querySelectorAll('.translation-item').forEach(el => {
      el.addEventListener('click', () => loadTranslation(el.dataset.collection, el.dataset.slug));
    });
  }

  function populateSelect() {
    const sel = $('slugSelect');
    let html = '<option value="">-- Select a translation --</option>';
    const translated = allPairs.filter(p => p.hasTranslation);
    const untranslated = allPairs.filter(p => !p.hasTranslation);

    if (translated.length) {
      html += '<optgroup label="Ready for Review">';
      translated.forEach(p => {
        html += '<option value="' + p.collection + '/' + p.slug + '">' + p.slug + ' [' + p.status.replace('_', ' ') + ']</option>';
      });
      html += '</optgroup>';
    }
    if (untranslated.length) {
      html += '<optgroup label="Not Translated">';
      untranslated.forEach(p => {
        html += '<option value="' + p.collection + '/' + p.slug + '" disabled>' + p.slug + ' (no translation)</option>';
      });
      html += '</optgroup>';
    }

    sel.innerHTML = html;
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const [col, slug] = sel.value.split('/');
      loadTranslation(col, slug);
    });
  }

  async function loadTranslation(collection, slug) {
    if (dirty && !confirm('You have unsaved changes. Discard?')) return;

    currentPair = { collection, slug };
    location.hash = collection + '/' + slug;
    $('slugSelect').value = collection + '/' + slug;

    const res = await fetch('/api/translation/' + collection + '/' + slug);
    currentData = await res.json();

    if (currentData.error) {
      alert('Error: ' + currentData.error);
      return;
    }

    $('landing').style.display = 'none';
    $('editorView').style.display = '';

    const badge = $('statusBadge');
    const status = currentData.tagalog ? (currentData.tagalog.frontmatter.translation_status || 'ai_draft') : 'untranslated';
    badge.textContent = status.replace('_', ' ');
    badge.className = 'status-badge status-' + status;
    badge.style.display = '';

    renderFrontmatterFields();
    renderEssentials();
    renderSections();

    $('draftBtn').disabled = !currentData.tagalog;
    $('saveBtn').disabled = !currentData.tagalog;

    updateNavButtons();
    dirty = false;
    clearFeedback();
  }

  function isHtmlOnly(text) {
    var stripped = text.replace(/<[^>]+>/g, '').replace(/\\s+/g, ' ').trim();
    return stripped.length < 20;
  }

  function stripHtml(text) {
    return text.replace(/<[^>]+>/g, '').replace(/\\n{3,}/g, '\\n\\n').trim();
  }

  function splitIntoSections(text) {
    if (!text || !text.trim()) return [{ label: 'Content', text: '', raw: '' }];
    var lines = text.split('\\n');
    var sections = [];
    var current = { label: 'Introduction', lines: [] };

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var headingMatch = line.match(/^(#{1,3})\\s+(.+)/);
      var htmlBlockMatch = line.match(/^<div\\s+class="(immersive-break[^"]*|scott-tips)/);

      if (headingMatch && current.lines.length > 0) {
        var raw = current.lines.join('\\n');
        sections.push({ label: current.label, text: stripHtml(raw), raw: raw, htmlOnly: isHtmlOnly(raw), isVideoBreak: current.isVideoBreak || false });
        current = { label: headingMatch[2].replace(/[*_\`]/g, '').slice(0, 60), lines: [line] };
      } else if (htmlBlockMatch && current.lines.length > 0) {
        var raw2 = current.lines.join('\\n');
        sections.push({ label: current.label, text: stripHtml(raw2), raw: raw2, htmlOnly: isHtmlOnly(raw2), isVideoBreak: current.isVideoBreak || false });
        var isBreak = htmlBlockMatch[1].includes('immersive');
        var blockType = isBreak ? 'Video Break' : "Scott's Pro Tips";
        current = { label: blockType, lines: [line], isVideoBreak: isBreak };
      } else {
        current.lines.push(line);
      }
    }
    if (current.lines.length > 0) {
      var rawFinal = current.lines.join('\\n');
      sections.push({ label: current.label, text: stripHtml(rawFinal), raw: rawFinal, htmlOnly: isHtmlOnly(rawFinal), isVideoBreak: current.isVideoBreak || false });
    }
    return sections;
  }

  function renderSections() {
    var container = $('sectionsContainer');
    var enSections = splitIntoSections(currentData.english.body);
    var tlSections = currentData.tagalog ? splitIntoSections(currentData.tagalog.body) : [];

    var html = '';
    var maxLen = Math.max(enSections.length, tlSections.length);
    var visibleCount = 0;

    for (var i = 0; i < maxLen; i++) {
      var en = enSections[i] || { label: '', text: '', raw: '', htmlOnly: true };
      var tl = tlSections[i] || { label: '', text: '', raw: '', htmlOnly: true };

      if ((en.htmlOnly && tl.htmlOnly) || en.isVideoBreak || tl.isVideoBreak) {
        html += '<input type="hidden" data-section-idx="' + i + '" value="' + escAttr(tl.raw) + '">';
        continue;
      }

      visibleCount++;
      var label = en.label || tl.label || 'Section ' + (i + 1);
      var enText = en.text || '';
      var tlText = tl.htmlOnly ? tl.raw : tl.text;
      var enRows = Math.max(4, enText.split('\\n').length + 1);
      var tlRows = Math.max(4, tlText.split('\\n').length + 1);
      var rows = Math.max(enRows, tlRows);

      html += '<div class="section-row">'
        + '<div class="section-label">' + escHtml(label) + ' (' + visibleCount + ')</div>'
        + '<div class="section-en"><textarea readonly rows="' + rows + '">' + escHtml(enText) + '</textarea></div>'
        + '<div class="section-tl"><textarea data-section-idx="' + i + '" rows="' + rows + '"'
        + (!currentData.tagalog ? ' readonly placeholder="No translation"' : '')
        + '>' + escHtml(tlText) + '</textarea></div>'
        + '</div>';
    }

    container.innerHTML = html;
    container.querySelectorAll('textarea[data-section-idx]').forEach(function(el) {
      el.addEventListener('input', function() { dirty = true; });
    });
  }

  function renderFrontmatterFields() {
    const fm = $('fmBar');
    const grid = $('fmGrid');

    if (!currentData.tagalog) { fm.style.display = 'none'; return; }

    fm.style.display = '';
    const enFm = currentData.english.frontmatter;
    const tlFm = currentData.tagalog.frontmatter;

    let html = '';
    for (const field of TRANSLATABLE) {
      if (enFm[field] === undefined) continue;
      html += '<div class="fm-pair">'
        + '<div class="fm-field"><label>EN: ' + field + '</label>'
        + '<textarea readonly rows="' + Math.max(1, Math.ceil((enFm[field] || '').length / 80)) + '">' + escHtml(enFm[field] || '') + '</textarea></div>'
        + '<div class="fm-field"><label>TL: ' + field + '</label>'
        + '<textarea data-fm-field="' + field + '" rows="' + Math.max(1, Math.ceil(((tlFm[field] || enFm[field] || '')).length / 80)) + '">' + escHtml(tlFm[field] || '') + '</textarea></div>'
        + '</div>';
    }

    grid.innerHTML = html;
    grid.querySelectorAll('textarea[data-fm-field]').forEach(el => {
      el.addEventListener('input', () => { dirty = true; });
    });
  }

  function renderEssentials() {
    const bar = $('essentialsBar');
    const grid = $('essentialsGrid');
    const enEss = currentData.english.frontmatter.essentials;
    const tlEss = currentData.tagalog?.frontmatter?.essentials;

    if (!enEss || !enEss.length || !tlEss) { bar.style.display = 'none'; return; }

    bar.style.display = '';
    let html = '';
    html += '<div style="font-size:12px;font-weight:600;color:#64748b;padding:4px 0;text-transform:uppercase;letter-spacing:0.5px">English (read-only)</div>';
    html += '<div style="font-size:12px;font-weight:600;color:#065f46;padding:4px 0;text-transform:uppercase;letter-spacing:0.5px">Tagalog (editable)</div>';

    for (let i = 0; i < enEss.length; i++) {
      const en = enEss[i];
      const tl = tlEss[i] || { icon: en.icon, label: '', value: '' };

      html += '<div class="essential-row"><span class="icon">' + (en.icon || '') + '</span><div class="fields">'
        + '<input type="text" value="' + escAttr(en.label) + '" readonly placeholder="label">'
        + '<input type="text" value="' + escAttr(en.value) + '" readonly placeholder="value">'
        + '</div></div>';

      html += '<div class="essential-row"><span class="icon">' + (tl.icon || en.icon || '') + '</span><div class="fields">'
        + '<input type="text" value="' + escAttr(tl.label) + '" data-ess-idx="' + i + '" data-ess-field="label" placeholder="label">'
        + '<input type="text" value="' + escAttr(tl.value) + '" data-ess-idx="' + i + '" data-ess-field="value" placeholder="value">'
        + '</div></div>';
    }

    grid.innerHTML = html;
    grid.querySelectorAll('input[data-ess-idx]').forEach(el => {
      el.addEventListener('input', () => { dirty = true; });
    });
  }


  async function save(action) {
    if (!currentData || !currentData.tagalog) return;

    if (action === 'final' && !confirm('Mark this translation as complete? Scott will be notified.')) return;

    var sectionEls = Array.from($('sectionsContainer').querySelectorAll('[data-section-idx]'));
    sectionEls.sort(function(a, b) { return parseInt(a.dataset.sectionIdx) - parseInt(b.dataset.sectionIdx); });
    var body = sectionEls.map(function(el) { return el.value; }).join('\\n');
    const frontmatter = {};

    $('fmGrid').querySelectorAll('textarea[data-fm-field]').forEach(el => {
      frontmatter[el.dataset.fmField] = el.value;
    });

    const enEss = currentData.english.frontmatter.essentials || [];
    const tlEss = currentData.tagalog.frontmatter.essentials || [];
    const essentials = [];
    for (let i = 0; i < enEss.length; i++) {
      const tl = tlEss[i] || { icon: enEss[i].icon, label: '', value: '' };
      const labelInput = $('essentialsGrid').querySelector('[data-ess-idx="' + i + '"][data-ess-field="label"]');
      const valueInput = $('essentialsGrid').querySelector('[data-ess-idx="' + i + '"][data-ess-field="value"]');
      essentials.push({
        icon: tl.icon || enEss[i].icon,
        label: labelInput ? labelInput.value : tl.label,
        value: valueInput ? valueInput.value : tl.value,
      });
    }
    frontmatter.essentials = essentials;

    const savingBtn = action === 'draft' ? $('draftBtn') : $('saveBtn');
    $('draftBtn').disabled = true;
    $('saveBtn').disabled = true;
    savingBtn.textContent = 'Saving...';

    try {
      const res = await fetch('/api/translation/' + currentPair.collection + '/' + currentPair.slug, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, frontmatter, action }),
      });
      const result = await res.json();

      if (result.success) {
        const newStatus = action === 'draft' ? 'in_review' : 'human_reviewed';
        const label = action === 'draft' ? 'Draft saved!' : 'Marked complete!';
        showFeedback(label, 'success');
        dirty = false;
        $('statusBadge').textContent = newStatus.replace('_', ' ');
        $('statusBadge').className = 'status-badge status-' + newStatus;
        const p = allPairs.find(x => x.slug === currentPair.slug && x.collection === currentPair.collection);
        if (p) p.status = newStatus;
        populateSelect();
        $('slugSelect').value = currentPair.collection + '/' + currentPair.slug;
      } else {
        showFeedback('Error: ' + (result.error || 'Unknown'), 'error');
      }
    } catch (e) {
      showFeedback('Error: ' + e.message, 'error');
    }

    $('draftBtn').disabled = false;
    $('saveBtn').disabled = false;
    $('draftBtn').textContent = 'Save Draft';
    $('saveBtn').textContent = 'Mark Complete';
  }

  function showFeedback(msg, type) {
    const el = $('saveFeedback');
    el.textContent = msg;
    el.className = 'save-feedback ' + type;
    if (type === 'success') setTimeout(() => { el.className = 'save-feedback'; }, 3000);
  }
  function clearFeedback() { $('saveFeedback').className = 'save-feedback'; }

  function updateNavButtons() {
    const translated = allPairs.filter(p => p.hasTranslation);
    const idx = translated.findIndex(p => p.slug === currentPair.slug && p.collection === currentPair.collection);
    $('prevBtn').disabled = idx <= 0;
    $('nextBtn').disabled = idx >= translated.length - 1 || idx === -1;
  }

  function navigate(dir) {
    const translated = allPairs.filter(p => p.hasTranslation);
    const idx = translated.findIndex(p => p.slug === currentPair.slug && p.collection === currentPair.collection);
    const next = translated[idx + dir];
    if (next) loadTranslation(next.collection, next.slug);
  }

  $('prevBtn').addEventListener('click', () => navigate(-1));
  $('nextBtn').addEventListener('click', () => navigate(1));
  $('draftBtn').addEventListener('click', () => save('draft'));
  $('saveBtn').addEventListener('click', () => save('final'));

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!$('draftBtn').disabled) save('draft');
    }
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!$('prevBtn').disabled) navigate(-1);
    }
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      if (!$('nextBtn').disabled) navigate(1);
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  init();
</script>
</body>
</html>`;
}
