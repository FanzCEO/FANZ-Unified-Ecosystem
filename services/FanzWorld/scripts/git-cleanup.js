#!/usr/bin/env node

/**
 * Git Repository Cleanup Script
 * 
 * This script performs Git repository maintenance operations:
 * - Expires all reflog entries immediately
 * - Performs garbage collection and prunes unreferenced objects
 * 
 * Usage:
 *   node scripts/git-cleanup.js
 *   npm run git:cleanup
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const runCommand = (command, description) => {
  try {
    log(`Starting: ${description}`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe' 
    });
    log(`Completed: ${description}`);
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
    return true;
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error');
    return false;
  }
};

const main = () => {
  log('Starting Git repository cleanup...');
  
  // Check if we're in a Git repository
  if (!existsSync('.git')) {
    log('Error: Not in a Git repository root directory', 'error');
    process.exit(1);
  }
  
  let success = true;
  
  // Step 1: Expire reflog entries
  success &&= runCommand(
    'git reflog expire --expire=now --all',
    'Expiring all reflog entries'
  );
  
  // Step 2: Garbage collect and prune
  success &&= runCommand(
    'git gc --prune=now',
    'Running garbage collection and pruning unreferenced objects'
  );
  
  if (success) {
    log('Git repository cleanup completed successfully! 🎉');
  } else {
    log('Git repository cleanup completed with errors', 'warn');
    process.exit(1);
  }
};

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as gitCleanup };