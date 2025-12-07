import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment configuration for the FANZ platform
export function loadEnvironment() {
  // Try different environment file paths in order of priority
  const envPaths = [
    resolve(process.cwd(), 'env/.env.local'),
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
  ];

  let envLoaded = false;
  
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      console.log(`📁 Loading environment from: ${envPath}`);
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        console.error(`❌ Error loading ${envPath}:`, result.error);
      } else {
        console.log(`✅ Environment loaded successfully`);
        envLoaded = true;
        break;
      }
    }
  }

  if (!envLoaded) {
    console.warn(`⚠️  No environment file found. Checked:`);
    envPaths.forEach(path => console.warn(`   - ${path}`));
    console.warn(`   Using system environment variables only.`);
  }

  // Validate critical environment variables
  validateEnvironment();
}

function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET', 
    'SESSION_SECRET',
    'NODE_ENV',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    
    // In production, fail fast if required vars are missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  } else {
    console.log('✅ All required environment variables present');
  }
}

// Call this function immediately when the module is imported
loadEnvironment();
