const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy file helper
function copyFile(srcName, destName = srcName) {
  const src = path.join(__dirname, srcName);
  const dest = path.join(publicDir, destName);
  if (fs.existsSync(src)) {
    const destParent = path.dirname(dest);
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied ${srcName} -> public/${destName}`);
  }
}

// Copy directory helper
function copyDir(dirName) {
  const src = path.join(__dirname, dirName);
  const dest = path.join(publicDir, dirName);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Copied ${dirName}/ -> public/${dirName}/`);
  }
}

console.log('Building static production bundle for Vercel...');

// Copy root static assets into public
copyFile('index.html');
copyFile('osint_tools.json');
copyFile('osint_tools.json', path.join('data', 'osint_tools.json'));
copyFile('osint_field_guide.pdf');
copyFile('OSINT_Field_Guide.xlsx');
copyDir('styles');
copyDir('scripts');

console.log('✅ Build complete! All static assets ready in public/');
