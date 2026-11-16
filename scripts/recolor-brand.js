const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const pairs = [
  ['#270052', '#310064'],
  ['#1c0138', '#240047'],
  ['#1b0138', '#240047'],
  ['#180038', '#240047'],
  ['#350066', '#310064'],
  ['#430080', '#6527B8'],
  ['#F5D45A', '#F4CC45'],
  ['#ffe56a', '#FFE58A'],
  ['#F7F3FB', '#FAF8FF'],
  ['#F6F1FB', '#F0E9FA'],
  ['#f6f1e8', '#F0E9FA'],
  ['#faf7f2', '#FAF8FF'],
  ['#1A1030', '#241536'],
  ['#eadff6', '#E9E1F1'],
  ['#e4d7f0', '#E9E1F1'],
  ['#e6dcc8', '#E9E1F1'],
  ['#3d2a55', '#746B80'],
  ['#4d3b63', '#746B80'],
  ['#5c4a70', '#746B80'],
  ['#3a2458', '#310064'],
  ['#6b4e16', '#6527B8'],
  ['#8a6a1d', '#6527B8'],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      let text = fs.readFileSync(full, 'utf8');
      const next = pairs.reduce((value, [from, to]) => value.split(from).join(to), text);
      if (next !== text) {
        fs.writeFileSync(full, next);
        console.log(path.relative(root, full));
      }
    }
  }
}

walk(root);
