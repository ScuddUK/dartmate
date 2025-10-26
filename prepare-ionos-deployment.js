#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 DartScorer IONOS Deployment Preparation\n');

// Check if dist folder exists
if (!fs.existsSync('dist')) {
    console.log('📦 Building production version...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build completed successfully!\n');
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Create deployment packages
const deploymentDir = 'ionos-deployment';
if (fs.existsSync(deploymentDir)) {
    fs.rmSync(deploymentDir, { recursive: true });
}
fs.mkdirSync(deploymentDir);

// Package 1: VPS Deployment (Full App)
console.log('📁 Creating VPS deployment package...');
const vpsDir = path.join(deploymentDir, 'vps-full-app');
fs.mkdirSync(vpsDir, { recursive: true });

// Copy necessary files for VPS
const vpsFiles = [
    'dist',
    'server',
    'package.json',
    'package-lock.json',
    'IONOS-VPS-DEPLOYMENT.md'
];

vpsFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        if (stats.isDirectory()) {
            copyDir(file, path.join(vpsDir, file));
        } else {
            fs.copyFileSync(file, path.join(vpsDir, file));
        }
    }
});

// Create VPS ecosystem config
const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'dartscorer',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}`;

fs.writeFileSync(path.join(vpsDir, 'ecosystem.config.js'), ecosystemConfig);

// Create VPS .env template
const envTemplate = `NODE_ENV=production
PORT=3001
# Add any other environment variables here`;

fs.writeFileSync(path.join(vpsDir, '.env.example'), envTemplate);

// Package 2: Static Deployment (Deploy Now)
console.log('📁 Creating static deployment package...');
const staticDir = path.join(deploymentDir, 'static-deploy-now');
fs.mkdirSync(staticDir, { recursive: true });

// Copy dist contents for static deployment
copyDir('dist', staticDir);

// Copy deployment guide
fs.copyFileSync('IONOS-STATIC-DEPLOYMENT.md', path.join(staticDir, 'DEPLOYMENT-GUIDE.md'));

// Create deployment info
const deploymentInfo = {
    name: 'DartScorer',
    version: '1.0.0',
    created: new Date().toISOString(),
    packages: {
        'vps-full-app': {
            description: 'Complete application with real-time features for IONOS VPS/Cloud Server',
            features: [
                'Real-time scoring synchronization',
                'Multi-device support',
                'Socket.IO connectivity',
                'Server-side game management',
                'Full feature set'
            ],
            requirements: 'IONOS VPS or Cloud Server',
            cost: '€4-15/month'
        },
        'static-deploy-now': {
            description: 'Static version for IONOS Deploy Now (shared hosting)',
            features: [
                'Local scoring interface',
                'Game configuration',
                'Mobile/desktop views',
                'Browser-only functionality'
            ],
            limitations: [
                'No real-time synchronization',
                'No multi-device support',
                'Local storage only'
            ],
            requirements: 'IONOS Deploy Now (shared hosting)',
            cost: 'FREE'
        }
    }
};

fs.writeFileSync(
    path.join(deploymentDir, 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
);

// Create main README
const mainReadme = `# DartScorer - IONOS Deployment Packages

This folder contains two deployment options for your IONOS hosting:

## 📦 Available Packages

### 1. VPS Full App (\`vps-full-app/\`)
- **For**: IONOS VPS or Cloud Server
- **Features**: Complete application with real-time scoring
- **Cost**: €4-15/month
- **Guide**: See \`IONOS-VPS-DEPLOYMENT.md\`

### 2. Static Deploy Now (\`static-deploy-now/\`)
- **For**: IONOS Deploy Now (shared hosting)
- **Features**: Basic scoring interface (no real-time)
- **Cost**: FREE
- **Guide**: See \`DEPLOYMENT-GUIDE.md\`

## 🚀 Quick Start

### For VPS Deployment:
1. Upload \`vps-full-app/\` contents to your VPS
2. Follow \`IONOS-VPS-DEPLOYMENT.md\`

### For Static Deployment:
1. Upload \`static-deploy-now/\` contents to Deploy Now
2. Follow \`DEPLOYMENT-GUIDE.md\`

## 💡 Recommendation
For the full DartScorer experience, use the VPS option to keep all real-time features.
`;

fs.writeFileSync(path.join(deploymentDir, 'README.md'), mainReadme);

console.log('✅ IONOS deployment packages created successfully!\n');
console.log('📂 Deployment packages location: ./ionos-deployment/');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Choose your IONOS hosting type:');
console.log('   - VPS/Cloud Server → Use vps-full-app/ (recommended)');
console.log('   - Deploy Now (shared) → Use static-deploy-now/');
console.log('');
console.log('2. Follow the respective deployment guide');
console.log('3. Upload files to your IONOS hosting');

// Helper function to copy directories
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}