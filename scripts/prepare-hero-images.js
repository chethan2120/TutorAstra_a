const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const assets = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'c-Users-A-M-Chethan-Kumar-Desktop-Project-Tutor-astra',
  'assets'
);
const outDir = path.join(root, 'public', 'images', 'hero');
fs.mkdirSync(outDir, { recursive: true });

const files = [
  ['tutor-guidance.jpg', 'tutor-guidance.png'],
  ['independent-study.jpg', 'independent-study.png'],
  ['student-success.jpg', 'student-success.png'],
];

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

(async () => {
  for (const [from, to] of files) {
    const source = path.join(assets, from);
    const target = path.join(outDir, to);
    if (sharp) await sharp(source).png().toFile(target);
    else fs.copyFileSync(source, target);
    console.log(target, fs.statSync(target).size, sharp ? 'png' : 'copied');
  }
})();
