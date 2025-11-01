#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TS18046 errors
const output = execSync('npm run type-check 2>&1 | grep "TS18046"', {
  encoding: 'utf-8',
  cwd: __dirname
}).trim();

const errors = output.split('\n').filter(line => line.includes('TS18046'));

// Parse errors and group by file
const fileErrors = {};
errors.forEach(error => {
  const match = error.match(/src\/(.+?)\((\d+),(\d+)\): error TS18046: '(.+?)' is of type 'unknown'/);
  if (match) {
    const [, file, line, col, varName] = match;
    const fullPath = `src/${file}`;
    if (!fileErrors[fullPath]) {
      fileErrors[fullPath] = [];
    }
    fileErrors[fullPath].push({ line: parseInt(line), col: parseInt(col), varName });
  }
});

console.log(`Found ${errors.length} 'unknown' type errors in ${Object.keys(fileErrors).length} files`);

// Fix each file
Object.entries(fileErrors).forEach(([file, errs]) => {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Group by variable name for this file
    const varErrors = {};
    errs.forEach(err => {
      if (!varErrors[err.varName]) {
        varErrors[err.varName] = [];
      }
      varErrors[err.varName].push(err);
    });

    // Fix each unique variable
    Object.entries(varErrors).forEach(([varName, varErrs]) => {
      // Find all usages of error.message, error.stack, etc
      content = content.replace(
        new RegExp(`${varName}\\.message`, 'g'),
        `(${varName} instanceof Error ? ${varName}.message : String(${varName}))`
      );

      content = content.replace(
        new RegExp(`${varName}\\.stack`, 'g'),
        `(${varName} instanceof Error ? ${varName}.stack : undefined)`
      );

      // For logger calls with just the error
      content = content.replace(
        new RegExp(`{ ${varName}: ${varName}\\.message }`, 'g'),
        `{ ${varName}: ${varName} instanceof Error ? ${varName}.message : String(${varName}) }`
      );

      content = content.replace(
        new RegExp(`{ error: ${varName}\\.message`, 'g'),
        `{ error: ${varName} instanceof Error ? ${varName}.message : String(${varName})`
      );
    });

    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✓ Fixed ${errs.length} errors in ${file}`);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

console.log('\nDone! Run npm run type-check to verify fixes.');
