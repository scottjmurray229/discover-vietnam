# Video Pipeline Overview

**Built for:** Discover More Travel Network (18 travel websites)
**Stack:** Node.js scripts + FFmpeg + Claude AI + ElevenLabs TTS
**Orchestrated by:** Claude Code (AI-powered CLI)

---

## What It Does

Automates the full lifecycle of stock footage from download to published website and YouTube:

```
Browse Shutterstock/Storyblocks → Download to ~/Downloads/ → Sweep & Organize → Compress → Watermark → Wire into Pages → Deploy → YouTube
```

The user manually browses and downloads clips from Shutterstock and Storyblocks. Claude Code then sweeps the Downloads folder and runs the full pipeline — rename, compress, wire into pages, deploy. One command (`node run-pipeline.cjs`) chains the processing steps. Each step also runs independently.

---

## The Problem It Solves

A travel website with 43 destinations needs ~500+ video clips:
- **Hero videos** — 15-18 sec loops for page headers
- **Immersive break clips** — 10-12 sec atmospheric clips between editorial sections
- **Preview clips** — 8 sec 720p cards for destination index pages
- **YouTube Shorts** — 30 sec narrated vertical videos
- **YouTube Guides** — 3-8 min full destination videos

Manually downloading, renaming, compressing, watermarking, and wiring 500+ clips into 43 pages would take weeks. This pipeline does it in hours.

---

## Architecture

```
video-tracking/
├── pipeline/                    # All automation scripts
│   ├── run-pipeline.cjs         # Orchestrator — chains steps 1-4
│   ├── 1-sweep-downloads.cjs    # Sweep ~/Downloads/ for new clips, rename & organize
│   ├── 2-batch-process.cjs      # FFmpeg compress + watermark for web
│   ├── 2.5-produce-youtube.cjs  # AI script + TTS + video render
│   ├── 3-deploy-videos.cjs      # Update frontmatter + build + deploy
│   ├── 4-youtube-upload.cjs     # YouTube Data API upload
│   ├── watermark-videos.cjs     # Batch watermark existing videos
│   ├── watermark-images.cjs     # Batch watermark existing images
│   ├── config-loader.cjs        # Reads config.env for API keys + paths
│   ├── config.env               # API keys (Claude, ElevenLabs, YouTube)
│   └── lib/                     # Shared utilities
├── video-inventory.yaml         # Master inventory (400+ entries with status tracking)
└── thumbnails/
    └── catalog.html             # Visual thumbnail grid for clip identification

raw-downloads/                   # Staging area (organized by type)
├── heroes/                      # Raw hero clips
├── breaks/                      # Raw break clips
└── thumbnails/                  # Raw thumbnail clips

youtube/
├── raw/                         # Original quality clips for YouTube editing (420+ files)
├── scripts/                     # AI-generated narration scripts
├── audio/                       # ElevenLabs TTS voice files
└── edited/                      # Finished YouTube Shorts ready for upload

public/videos/destinations/      # Compressed web-ready clips (deployed to CDN)
├── bangkok-hero.mp4             # 1080p, CRF 24, 18s, watermarked
├── bangkok-break-1.mp4          # 1080p, CRF 25, 12s, watermarked
├── bangkok-preview.mp4          # 720p, CRF 26, 8s, watermarked
└── ...
```

---

## Pipeline Steps

### Step 1: Sweep Downloads & Organize (`1-sweep-downloads.cjs`)

**What:** Sweeps `~/Downloads/` for newly downloaded stock clips, renames them with standardized naming, and organizes into the correct folders.

**How it works:**
1. User manually browses **Shutterstock** and **Storyblocks** websites, searching for clips using terms from `video-inventory.yaml`
2. User downloads selected clips to `~/Downloads/`
3. User tells Claude Code they're "done" downloading
4. Script scans `~/Downloads/` for new `.mp4`/`.mov` files (by recency)
5. Renames to `{destination}-{descriptor}.mp4` based on content
6. Copies to both `raw-downloads/` (for web processing) and `youtube/raw/` (for YouTube editing)
7. Updates inventory YAML: `stock_status: downloaded`

**CLI:**
```bash
node video-tracking/pipeline/1-sweep-downloads.cjs                  # All new clips
node video-tracking/pipeline/1-sweep-downloads.cjs --dest bangkok   # Filter to one destination
```

**Note:** There is no API integration with Shutterstock or Storyblocks. All browsing and downloading is done manually by the user through the stock library websites. The pipeline picks up after download.

---

### Step 2: Batch Process (`2-batch-process.cjs`)

**What:** FFmpeg compresses raw clips for web delivery. Applies watermark. Generates preview clips from heroes.

**How it works:**
1. Scans `raw-downloads/` for unprocessed `.mp4` files
2. Applies the correct compression profile based on clip type:

| Profile | Resolution | CRF | Duration | Watermark Size | Use Case |
|---------|-----------|-----|----------|---------------|----------|
| Hero | 1920x1080 | 24 | 18s | 32px | Page header background |
| Immersive Break | 1920x1080 | 25 | 12s | 32px | Full-width editorial breaks |
| Preview/Thumbnail | 1280x720 | 26 | 8s | 22px | Index page cards |

3. FFmpeg command (per clip):
```bash
ffmpeg -y -i "INPUT.mp4" \
  -t 12 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,drawtext=text='discoverphilippines.info':fontsize=32:fontcolor=white@0.8:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=w-tw-20:y=h-th-20:fontfile='/Windows/Fonts/arialbd.ttf'" \
  -c:v libx264 -crf 25 -preset medium -r 24 \
  -an -movflags +faststart -pix_fmt yuv420p \
  "OUTPUT.mp4"
```

4. Key FFmpeg flags explained:
   - `-an` — Strip audio (web backgrounds are silent)
   - `-movflags +faststart` — Move MP4 atom to start for instant web playback
   - `-pix_fmt yuv420p` — Maximum browser compatibility
   - `drawtext=...` — Burns domain watermark into bottom-right corner
   - `scale=...pad=...` — Handles any input aspect ratio without stretching
5. Skips files already processed (compares timestamps)
6. Outputs to `public/videos/destinations/`

**CLI:**
```bash
node video-tracking/pipeline/2-batch-process.cjs                  # All unprocessed
node video-tracking/pipeline/2-batch-process.cjs --dest boracay   # One destination
node video-tracking/pipeline/2-batch-process.cjs --heroes-only    # Heroes only
node video-tracking/pipeline/2-batch-process.cjs --dry-run        # Preview commands
```

---

### Step 2.5: YouTube Production (`2.5-produce-youtube.cjs`)

**What:** Fully automated YouTube Short creation — AI writes the script, TTS reads it, video renders with text overlays.

**How it works:**
1. Loads destination data from Astro content collection (highlights, budget, best months, etc.)
2. **Claude AI** generates a 30-second narration script tailored to the destination
3. **ElevenLabs** synthesizes the script into voice audio using a cloned voice
4. **Remotion** (React-based video renderer) composites:
   - Raw B-roll clips from `youtube/raw/`
   - Animated text overlays (destination name, key facts, CTA)
   - Voice narration audio track
5. Outputs finished 30-sec YouTube Short to `youtube/edited/`

**API Keys Required:**
- `ANTHROPIC_API_KEY` — Claude for script generation
- `ELEVENLABS_API_KEY` — Text-to-speech
- `ELEVENLABS_VOICE_ID` — Cloned voice ID

**CLI:**
```bash
node video-tracking/pipeline/2.5-produce-youtube.cjs                # All destinations
node video-tracking/pipeline/2.5-produce-youtube.cjs --dest bohol   # Single
node video-tracking/pipeline/2.5-produce-youtube.cjs --dry-run      # Preview
node video-tracking/pipeline/2.5-produce-youtube.cjs --force-render # Re-render only
```

---

### Step 3: Deploy (`3-deploy-videos.cjs`)

**What:** Wires compressed clips into website pages, builds the site, deploys to CDN.

**How it works:**
1. Scans `public/videos/destinations/` for processed clips
2. Updates destination `.md` frontmatter: sets `heroVideo` path
3. Updates destination index page: adds video paths to `videoMap` for card previews
4. Updates `video-inventory.yaml`: sets `file_path` for each clip
5. Runs `npm run build` (Astro static site build)
6. Deploys to Cloudflare Pages via `npx wrangler pages deploy`

**CLI:**
```bash
node video-tracking/pipeline/3-deploy-videos.cjs              # Full deploy
node video-tracking/pipeline/3-deploy-videos.cjs --no-deploy  # Update files only
node video-tracking/pipeline/3-deploy-videos.cjs --dry-run    # Preview changes
```

---

### Step 4: YouTube Upload (`4-youtube-upload.cjs`)

**What:** Uploads finished YouTube Shorts/Guides to YouTube with metadata.

**How it works:**
1. Reads edited videos from `youtube/edited/`
2. Uses YouTube Data API v3 for authenticated upload
3. Sets title, description, tags, category, privacy status
4. Adds to appropriate playlist

---

### Watermark Scripts (standalone)

For retroactively watermarking existing files that weren't processed through the pipeline:

```bash
node video-tracking/pipeline/watermark-videos.cjs              # All videos
node video-tracking/pipeline/watermark-videos.cjs --dest cebu  # Single destination
node video-tracking/pipeline/watermark-videos.cjs --dry-run    # Preview

node video-tracking/pipeline/watermark-images.cjs              # All images
node video-tracking/pipeline/watermark-images.cjs --dry-run    # Preview
```

These track state in JSON files (`watermark-videos-state.json`, `watermark-images-state.json`) so they only process each file once.

---

## Orchestrator

The `run-pipeline.cjs` script chains steps sequentially:

```bash
# Default: Steps 1 → 2 → 3 (search, compress, deploy)
node video-tracking/pipeline/run-pipeline.cjs

# Include YouTube production
node video-tracking/pipeline/run-pipeline.cjs --produce    # Steps 1 → 2 → 2.5 → 3

# Full pipeline including upload
node video-tracking/pipeline/run-pipeline.cjs --all        # Steps 1 → 2 → 2.5 → 3 → 4

# Resume from a specific step
node video-tracking/pipeline/run-pipeline.cjs --from 2     # Skip search, start at compress

# Single step only
node video-tracking/pipeline/run-pipeline.cjs --step 2.5   # YouTube production only

# Filter to one destination
node video-tracking/pipeline/run-pipeline.cjs --dest bohol
```

---

## Video Inventory Tracking (`video-inventory.yaml`)

Master inventory file tracks every clip across the project:

```yaml
entries:
  - page: bangkok              # Destination slug
    slot: hero                  # hero | break-1 | break-2 | preview
    priority: p0                # p0 (hero) | p1 (breaks) | p2 (previews)
    search_terms: "Bangkok temples aerial drone golden"
    stock_source: shutterstock  # shutterstock | storyblocks
    stock_id: "SBV-352728973"   # Stock library clip ID
    stock_status: downloaded    # needs_download | downloaded | processed
    file_path: "public/videos/destinations/bangkok-hero.mp4"
    notes: "Golden Mount temple at night, 4K aerial"
```

Status workflow: `needs_download → downloaded → processed`

---

## Web Pipeline Tool (Bonus)

A separate web-based UI for the pipeline, deployed on Railway:

**URL:** https://just-kindness-production.up.railway.app
**Auth:** admin / masangcay

Features:
- Multi-site support (6 sites configured, expandable to 18)
- Upload clips downloaded from Shutterstock/Storyblocks
- One-click FFmpeg compression
- Direct GitHub push of processed clips
- No CLI needed — browser-based workflow

---

## Watermark Specification

Every deployed video and image gets a domain watermark:

| Property | Value |
|----------|-------|
| Text | `discoverthailand.info` (varies per site) |
| Color | White @ 80% opacity |
| Shadow | Black @ 60% opacity, 2px offset |
| Position | Bottom-right, 20px from edges |
| Font | Arial Bold (`/Windows/Fonts/arialbd.ttf`) |
| Size (1080p) | 32px |
| Size (720p) | 22px |
| Size (images) | ~3% of image height |

FFmpeg drawtext filter (copy-paste ready):
```
drawtext=text='yourdomain.com':fontsize=32:fontcolor=white@0.8:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=w-tw-20:y=h-th-20:fontfile='/Windows/Fonts/arialbd.ttf'
```

---

## How Claude Code Fits In

Claude Code (the AI CLI) orchestrates the entire pipeline conversationally:

1. **User browses** Shutterstock.com and Storyblocks.com, downloading clips to `~/Downloads/`
2. **User says "done"** in Claude Code
3. **Claude Code automatically:**
   - Sweeps `~/Downloads/` for new `.mp4`/`.mov` files
   - Moves & renames to `raw-downloads/` and `youtube/raw/`
   - Runs FFmpeg compression with watermarks
   - Wires clips into the correct destination pages (edits Markdown/Astro files)
   - Updates inventory YAML
   - Builds the site
   - Deploys to Cloudflare Pages
4. **User sees:** Page goes from gradient placeholder → cinematic video break

No manual FFmpeg commands, no file management, no frontmatter editing. One conversation turn processes an entire batch.

---

## Adapting for Other Projects

The pipeline is designed to be forked per site. To adapt:

1. **Copy `video-tracking/pipeline/` directory** to your project
2. **Create `config.env`** with your API keys
3. **Update watermark text** in `2-batch-process.cjs` and `watermark-videos.cjs`
4. **Adjust compression profiles** in `2-batch-process.cjs` (CRF, resolution, duration)
5. **Update deploy command** in `3-deploy-videos.cjs` (your hosting platform)

The scripts are pure Node.js with only two dependencies: `js-yaml` for inventory parsing and FFmpeg for video processing. No build tools, no bundlers.

### For a Video Designer's Workflow

If you're a video editor/designer, the most useful pieces to adapt:

- **Batch compression script** — Process 100+ clips with consistent settings in one command
- **Watermark automation** — Never manually add watermarks again
- **Inventory tracking** — Know exactly which clips are downloaded, processed, and deployed
- **YouTube production** — AI writes scripts, TTS reads them, video renders automatically
- **Claude Code integration** — Describe what you want in natural language, Claude executes the pipeline

---

## Stats (Philippines Site)

| Metric | Count |
|--------|-------|
| Total destinations | 43 |
| Hero videos | 43 |
| Break clips deployed | 170+ |
| YouTube Shorts produced | 9 |
| Raw clips in library | 420+ |
| Inventory entries | 400+ |
| Watermarked video files | 287 |

Processing time: ~2 minutes per clip (4K → 1080p compressed + watermarked).
