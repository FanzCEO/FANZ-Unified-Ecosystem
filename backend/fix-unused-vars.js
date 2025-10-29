#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

// Get all TS6133 errors
const output = execSync('npm run type-check 2>&1 | grep "TS6133"', {
  encoding: 'utf-8',
  cwd: __dirname
}).trim();

const errors = output.split('\n').filter(line => line.includes('TS6133'));

// Parse errors and group by file
const fileErrors = {};
errors.forEach(error => {
  const match = error.match(/src\/(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared/);
  if (match) {
    const [, file, line, col, varName] = match;
    const fullPath = `src/${file}`;
    if (!fileErrors[fullPath]) {
      fileErrors[fullPath] = [];
    }
    fileErrors[fullPath].push({ line: parseInt(line), col: parseInt(col), varName });
  }
});

console.log(`Found ${errors.length} unused variable errors in ${Object.keys(fileErrors).length} files`);

// Fix each file
Object.entries(fileErrors).forEach(([file, errs]) => {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Sort errors by line number (descending) to avoid offset issues
    errs.sort((a, b) => b.line - a.line);

    errs.forEach(({ line, varName }) => {
      const lineIndex = line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const originalLine = lines[lineIndex];
        // Skip if already prefixed with underscore
        if (!originalLine.includes(`_${varName}`)) {
          // Replace variable name with underscore-prefixed version
          const regex = new RegExp(`\\b${varName}\\b(?!:)`, 'g');
          lines[lineIndex] = originalLine.replace(regex, `_${varName}`);
        }
      }
    });

    fs.writeFileSync(file, lines.join('\n'), 'utf-8');
    console.log(`✓ Fixed ${errs.length} errors in ${file}`);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

console.log('\nDone! Run npm run type-check to verify fixes.');
