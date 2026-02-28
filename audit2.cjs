const fs = require('fs');
const c = fs.readFileSync('C:/Users/scott/documents/discover-philippines/src/content/destinations/zambales.md', 'utf8');
console.log('Has CRLF:', c.includes('\r\n'));
const normalized = c.replace(/\r\n/g, '\n');
const m = normalized.match(/^---\n([\s\S]*?)\n---/);
console.log('FM match:', !!m);
if (m) {
  console.log('FM first 100:', m[1].substring(0, 100));
  console.log('Has title:', /^title:/m.test(m[1]));
  console.log('Has draft:', /^draft:/m.test(m[1]));
  console.log('Has affiliatePicks:', /^affiliatePicks:/m.test(m[1]));
}
