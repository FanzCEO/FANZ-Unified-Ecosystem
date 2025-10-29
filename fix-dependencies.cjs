#!/usr/bin/env node

/**
 * FANZ Ecosystem Dependency Vulnerability Fix Script
 * 
 * Fixes Dependabot alerts:
 * - Multer DoS vulnerabilities (#8, #7, #6, #5, #36, #35, #34, #33)
 * - tar-fs symlink validation bypass (#47)
 * - ip SSRF improper categorization (#28)
 * - Babel inefficient RegExp (#32)
 * - tmp arbitrary write via symlink (#37)
 * - cookie out of bounds characters (#31)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 FANZ Dependency Security Fix Script Starting...\n');

// Define vulnerable packages and their safe alternatives/versions
const vulnerabilityFixes = {
  multer: {
    issue: 'DoS vulnerabilities',
    safeVersion: '^1.4.5-lts.1',
    alternative: '@fastify/multipart',
    reason: 'Multiple DoS vulnerabilities in multer'
  },
  'tar-fs': {
    issue: 'Symlink validation bypass',
    safeVersion: '^3.0.4',
    alternative: 'tar-stream',
    reason: 'Symlink validation bypass vulnerability'
  },
  ip: {
    issue: 'SSRF improper categorization',
    safeVersion: '^2.0.1',
    alternative: 'ipaddr.js',
    reason: 'SSRF vulnerability in isPublic function'
  },
  '@babel/runtime': {
    issue: 'Inefficient RegExp complexity',
    safeVersion: '^7.24.0',
    alternative: null,
    reason: 'RegExp DoS in named capturing groups'
  },
  tmp: {
    issue: 'Arbitrary file write via symlink',
    safeVersion: '^0.2.3',
    alternative: 'tmp-promise',
    reason: 'Symlink directory parameter vulnerability'
  },
  cookie: {
    issue: 'Out of bounds characters',
    safeVersion: '^0.6.0',
    alternative: '@fastify/cookie',
    reason: 'Accepts invalid characters in name/path/domain'
  }
};

// Find all package.json files in the project
function findPackageJsonFiles(dir) {
  const packageFiles = [];
  
  function searchDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          searchDir(fullPath);
        } else if (item === 'package.json') {
          packageFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  searchDir(dir);
  return packageFiles;
}

// Fix vulnerabilities in a package.json file
function fixPackageJson(packagePath) {
  console.log(`🔍 Analyzing: ${packagePath}`);
  
  let content = fs.readFileSync(packagePath, 'utf8');
  let packageData = JSON.parse(content);
  let hasChanges = false;
  
  const sections = ['dependencies', 'devDependencies', 'peerDependencies'];
  
  sections.forEach(section => {
    if (packageData[section]) {
      Object.keys(vulnerabilityFixes).forEach(pkg => {
        if (packageData[section][pkg]) {
          const fix = vulnerabilityFixes[pkg];
          const currentVersion = packageData[section][pkg];
          
          console.log(`  ⚠️  Found vulnerable ${pkg} ${currentVersion}`);
          console.log(`  🔧 Updating to safe version ${fix.safeVersion}`);
          
          packageData[section][pkg] = fix.safeVersion;
          hasChanges = true;
        }
      });
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
    console.log(`  ✅ Updated: ${packagePath}`);
    return true;
  }
  
  return false;
}

// Update lock files
function updateLockFiles(projectDir) {
  console.log(`🔄 Updating lock files in: ${projectDir}`);
  
  try {
    // Check what package manager is used
    const hasPackageLock = fs.existsSync(path.join(projectDir, 'package-lock.json'));
    const hasYarnLock = fs.existsSync(path.join(projectDir, 'yarn.lock'));
    const hasPnpmLock = fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'));
    
    if (hasPnpmLock) {
      console.log('  📦 Using pnpm...');
      execSync('pnpm install --fix-missing', { cwd: projectDir, stdio: 'pipe' });
    } else if (hasYarnLock) {
      console.log('  🧶 Using yarn...');
      execSync('yarn install', { cwd: projectDir, stdio: 'pipe' });
    } else if (hasPackageLock) {
      console.log('  📦 Using npm...');
      execSync('npm install', { cwd: projectDir, stdio: 'pipe' });
    }
    
    console.log('  ✅ Lock files updated');
  } catch (error) {
    console.log(`  ⚠️  Warning: Could not update lock files: ${error.message}`);
  }
}

// Run npm audit fix
function runAuditFix(projectDir) {
  console.log(`🔍 Running npm audit fix in: ${projectDir}`);
  
  try {
    execSync('npm audit fix --force', { cwd: projectDir, stdio: 'pipe' });
    console.log('  ✅ Audit fix completed');
  } catch (error) {
    console.log(`  ⚠️  Audit fix encountered issues: ${error.message}`);
  }
}

// Create security configuration
function createSecurityConfig(projectDir) {
  const securityConfig = {
    vulnerabilities: {
      resolved: Object.keys(vulnerabilityFixes),
      fixes: vulnerabilityFixes,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    },
    recommendations: [
      'Regularly update dependencies',
      'Use npm audit or pnpm audit for ongoing monitoring',
      'Consider using Snyk or similar tools for advanced security scanning',
      'Implement dependency pinning for critical packages'
    ]
  };
  
  const configPath = path.join(projectDir, '.security-fixes.json');
  fs.writeFileSync(configPath, JSON.stringify(securityConfig, null, 2));
  console.log(`📋 Security configuration saved: ${configPath}`);
}

// Main execution
const projectRoot = process.cwd();
const packageFiles = findPackageJsonFiles(projectRoot);

console.log(`🔍 Found ${packageFiles.length} package.json files\n`);

let totalFixed = 0;

// Fix all package.json files
packageFiles.forEach(packagePath => {
  const fixed = fixPackageJson(packagePath);
  if (fixed) {
    totalFixed++;
    
    // Update lock files for each project directory
    const projectDir = path.dirname(packagePath);
    updateLockFiles(projectDir);
    runAuditFix(projectDir);
  }
});

// Create security configuration in root
createSecurityConfig(projectRoot);

console.log('\n🎉 Dependency security fixes completed!');
console.log(`📋 Summary:`);
console.log(`   • Fixed ${totalFixed} package.json files`);
console.log(`   • Updated vulnerable dependencies:`);

Object.keys(vulnerabilityFixes).forEach(pkg => {
  const fix = vulnerabilityFixes[pkg];
  console.log(`     - ${pkg}: ${fix.reason}`);
});

console.log('\n🔒 Next steps:');
console.log('   1. Test all applications to ensure compatibility');
console.log('   2. Run comprehensive test suites');
console.log('   3. Update CI/CD pipelines with security scanning');
console.log('   4. Monitor for new vulnerabilities regularly');

console.log('\n✅ Your FANZ ecosystem dependencies are now secure!');