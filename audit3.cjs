const fs = require('fs');
const c = fs.readFileSync('C:/Users/scott/documents/discover-philippines/src/content/destinations/zambales.md', 'utf8');
const n = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
// Check if there are the two --- markers
const firstDash = n.indexOf('---');
const secondDash = n.indexOf('---', firstDash + 3);
console.log('First --- at:', firstDash);
console.log('Second --- at:', secondDash);
if (secondDash > 0) {
  console.log('Content around second ---:', JSON.stringify(n.substring(secondDash - 10, secondDash + 10)));
  const fm = n.substring(firstDash + 4, secondDash);
  console.log('FM length:', fm.length);
  console.log('Has title:', /^title:/m.test(fm));
  console.log('Has draft:', /^draft:/m.test(fm));
}
// Check for BOM
console.log('BOM check:', c.charCodeAt(0) === 0xFEFF);
console.log('First char code:', c.charCodeAt(0));
