/**
 * Loads destination frontmatter data for video production.
 * Follows the same pattern as 4-youtube-upload.cjs lines 41-60.
 */
const fs = require('fs');
const path = require('path');

/**
 * Load frontmatter for a single destination
 * @param {string} projectRoot - Project root path
 * @param {string} slug - Destination slug (e.g., 'boracay')
 * @returns {object|null} Parsed frontmatter data or null
 */
function loadDestination(projectRoot, slug) {
  const filePath = path.join(projectRoot, 'src', 'content', 'destinations', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const yaml = require('js-yaml');
  const fm = yaml.load(fmMatch[1]);

  return {
    slug,
    title: fm.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    tagline: fm.tagline || '',
    description: fm.description || '',
    region: fm.region || 'philippines',
    bestMonths: fm.bestMonths || [],
    budgetPerDay: fm.budgetPerDay || { backpacker: 30, midRange: 80, luxury: 200 },
    gettingThere: fm.gettingThere || '',
    highlights: (fm.highlights || []).map(h =>
      typeof h === 'string' ? { title: h } : { title: h.title || h, icon: h.icon }
    ),
    gradientColors: fm.gradientColors || '',
  };
}

/**
 * Load frontmatter for all destinations
 * @param {string} projectRoot - Project root path
 * @returns {object} Map of slug -> frontmatter data
 */
function loadAllDestinations(projectRoot) {
  const destDir = path.join(projectRoot, 'src', 'content', 'destinations');
  const destinations = {};

  try {
    for (const file of fs.readdirSync(destDir).filter(f => f.endsWith('.md'))) {
      const slug = file.replace('.md', '');
      const data = loadDestination(projectRoot, slug);
      if (data) destinations[slug] = data;
    }
  } catch (e) {
    console.warn('Warning: Could not load destinations:', e.message);
  }

  return destinations;
}

module.exports = { loadDestination, loadAllDestinations };
