const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'content', 'destinations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.includes('tl'));
const results = [];

for (const file of files) {
  let c = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n');
  const m = c.match(/^---\n([\s\S]*?)\n---/);
  const fm = m ? m[1] : '';
  const bo = m ? c.slice(m[0].length) : c;

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
  if (!bo.includes('class="scott-tips"')) mb.push('ST');
  if (!/##[^#]*[Ss]tay/m.test(bo)) mb.push('WS');
  if (!/##[^#]*[Ee]at/m.test(bo)) mb.push('WE');
  if (!bo.includes('class="jenice-callout"')) mb.push('JC');
  const br = (bo.match(/class="immersive-break-inline"/g) || []).length;
  if (br === 0) mb.push('IB');
  const vi = (bo.match(/<source[^>]*type="video/g) || []).length;

  let pc = 0, hw = 0, hm = 0;
  if (ck('affiliatePicks')) {
    pc = (fm.match(/  - name:/g) || []).length;
    const as = fm.slice(fm.indexOf('affiliatePicks:'));
    const bl = as.split(/\n  - name:/g).slice(1);
    for (const b of bl) {
      const ih = /    type:\s*hotel/m.test(b);
      const hu = /affiliateUrl:/.test(b);
      const ha = /aid=2778866/.test(b);
      if (ih && hu && ha) hw++;
      if (ih && (!hu || !ha)) hm++;
    }
  }

  results.push({
    f: file.replace('.md',''),
    d: v('draft'),
    s: v('contentStatus'),
    hv: v('heroVideo'),
    mf, mb, br, vi, pc, hw, hm
  });
}

console.log(JSON.stringify(results, null, 2));
