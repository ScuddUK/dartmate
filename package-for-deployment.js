#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Packaging DartScorer for deployment...');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Build not found. Please run "npm run build" first.');
  process.exit(1);
}

// Create deployment package info
const packageInfo = {
  name: 'DartScorer',
  version: '1.0.0',
  description: 'Professional dart scoring application',
  buildDate: new Date().toISOString(),
  files: {
    frontend: 'dist/',
    backend: 'server/',
    config: 'package.json',
    instructions: 'DEPLOYMENT.md'
  },
  requirements: {
    node: '>=18.0.0',
    npm: '>=8.0.0'
  },
  ports: {
    production: 3001,
    development: {
      frontend: 3000,
      backend: 3001
    }
  }
};

// Write package info
fs.writeFileSync(
  path.join(__dirname, 'deployment-info.json'),
  JSON.stringify(packageInfo, null, 2)
);

console.log('✅ Deployment package ready!');
console.log('\n📋 Package Contents:');
console.log('   • dist/ - Built React application');
console.log('   • server/ - Backend server code');
console.log('   • package.json - Dependencies and scripts');
console.log('   • DEPLOYMENT.md - Setup instructions');
console.log('   • deployment-info.json - Package information');

console.log('\n🚀 To deploy:');
console.log('   1. Copy all files to your server');
console.log('   2. Run: npm install');
console.log('   3. Run: npm run start:windows (Windows) or npm start (Linux/Mac)');
console.log('   4. Access: http://localhost:3001');

console.log('\n📖 See DEPLOYMENT.md for detailed instructions.');