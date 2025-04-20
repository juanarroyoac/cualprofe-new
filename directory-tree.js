// Save this as directory-tree.js
const fs = require('fs');
const path = require('path');

// Directories to exclude
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

function printDirectoryTree(dir, indent = '') {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach((file, index) => {
      const filePath = path.join(dir, file);
      
      // Skip excluded directories
      if (excludeDirs.includes(file)) return;
      
      try {
        const stats = fs.statSync(filePath);
        const isLast = index === files.filter(f => !excludeDirs.includes(f)).length - 1;
        const prefix = indent + (isLast ? '└── ' : '├── ');
        const nextIndent = indent + (isLast ? '    ' : '│   ');
        
        console.log(prefix + file + (stats.isDirectory() ? '/' : ''));
        
        if (stats.isDirectory()) {
          printDirectoryTree(filePath, nextIndent);
        }
      } catch (err) {
        console.log(prefix + file + ' [error reading]');
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
  }
}

console.log('Project Directory Structure:');
console.log('.');
printDirectoryTree('.', '');