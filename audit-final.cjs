const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'content', 'destinations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.includes('tl'));

for (const file of files) {
  let c = fs.readFileSync(path.join(dir, file), 'utf8');
  // Remove BOM if present
  if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1);
  c = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = c.match(/^---\n([\s\S]*?)\n---/);
  if (!m) {
    console.log(file + '|PARSE_ERROR|||||');
    continue;
  }
  const fm = m[1];
  const bo = c.slice(m[0].length);

  const ck = s => new RegExp('^' + s + ':', 'm').test(fm);
  const v = s => {
    const match = fm.match(new RegExp('^' + s + ':\\s*"?([^"\\n]*)"?', 'm'));
    return match ? match[1].trim() : '';
  };

  const mf = [];
  const ff = ['title','description','heroVideo','tagline','region','bestMonths','budgetPerDay',
    'gettingThere','essentials','highlights','gradientColors','relatedDestinations',
    'faqItems','affiliatePicks','lastVerified','contentStatus','draft'];
  for (const f of ff) { if (!ck(f)) mf.push(f); }

  const mb = [];
  if (!bo.includes('class="scott-tips"')) mb.push('scott-tips');
  if (!/##[^#]*[Ss]tay/m.test(bo)) mb.push('WhereToStay');
  if (!/##[^#]*[Ee]at/m.test(bo)) mb.push('WhereToEat');
  if (!bo.includes('class="jenice-callout"')) mb.push('jenice-callout');
  const br = (bo.match(/class="immersive-break-inline"/g) || []).length;
  if (br === 0) mb.push('immersive-breaks');
  const vi = (bo.match(/<source[^>]*type="video/g) || []).length;

  let pc = 0, hw = 0, hm = 0, picksDetail = [];
  if (ck('affiliatePicks')) {
    pc = (fm.match(/  - name:/g) || []).length;
    const as = fm.slice(fm.indexOf('affiliatePicks:'));
    const bl = as.split(/\n  - name:/g).slice(1);
    for (const b of bl) {
      const nm = b.split('\n')[0].trim().replace(/"/g, '');
      const ih = /    type:\s*hotel/m.test(b);
      const hu = /affiliateUrl:/.test(b);
      const ha = /aid=2778866/.test(b);
      if (ih && hu && ha) hw++;
      if (ih && (!hu || !ha)) hm++;

      const hasName = true;
      const hasType = /    type:/m.test(b);
      const hasPrice = /    price:/m.test(b);
      const hasNote = /    personalNote:/m.test(b);
      const pmissing = [];
      if (!hasType) pmissing.push('type');
      if (!hasPrice) pmissing.push('price');
      if (!hasNote) pmissing.push('personalNote');
      if (ih && !hu) pmissing.push('affiliateUrl');

      if (pmissing.length > 0) {
        picksDetail.push(nm + ':' + pmissing.join(','));
      }
    }
  }

  const slug = file.replace('.md', '');
  // Output: slug|draft|status|heroVideo|missingFM|missingBody|breaks|videos|picks|hotelsOK|hotelsMissing|picksIssues
  console.log([
    slug,
    v('draft'),
    v('contentStatus'),
    v('heroVideo'),
    mf.join(',') || 'NONE',
    mb.join(',') || 'NONE',
    br,
    vi,
    pc,
    hw,
    hm,
    picksDetail.join(';') || 'NONE'
  ].join('|'));
}
