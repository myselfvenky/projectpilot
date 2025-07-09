const fs = require('fs');
const path = require('path');

// Create build directory if it doesn't exist
if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

// Copy and modify main.js to electron.js
let mainContent = fs.readFileSync('src/main.js', 'utf8');
// Update the preload path to be relative to build directory
mainContent = mainContent.replace(
  "preload: path.join(__dirname, 'preload.js')",
  "preload: path.join(__dirname, 'preload.js')"
);
// Update the index.html path for production builds
mainContent = mainContent.replace(
  "mainWindow.loadFile(path.join(__dirname, '../build/index.html'));",
  "mainWindow.loadFile(path.join(__dirname, 'index.html'));"
);
fs.writeFileSync('build/electron.js', mainContent);
console.log('Copied and modified src/main.js to build/electron.js');

// Copy other files
const filesToCopy = [
  { src: 'src/preload.js', dest: 'build/preload.js' },
  { src: 'src/database.js', dest: 'build/database.js' }
];

filesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.error(`Source file ${src} does not exist`);
  }
});

console.log('Electron files copied successfully!'); 