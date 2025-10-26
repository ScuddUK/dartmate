#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 DartScorer - Free Hosting Preparation\n');

// Check if we're in a git repository
let isGitRepo = false;
try {
    execSync('git status', { stdio: 'ignore' });
    isGitRepo = true;
    console.log('✅ Git repository detected');
} catch (error) {
    console.log('⚠️  Not a git repository - will initialize');
}

// Initialize git if needed
if (!isGitRepo) {
    console.log('📦 Initializing git repository...');
    try {
        execSync('git init', { stdio: 'inherit' });
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Initial commit - DartScorer ready for deployment"', { stdio: 'inherit' });
        execSync('git branch -M main', { stdio: 'inherit' });
        console.log('✅ Git repository initialized');
    } catch (error) {
        console.error('❌ Git initialization failed:', error.message);
    }
}

// Test build
console.log('\n📦 Testing production build...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful!');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Create .gitignore if it doesn't exist
if (!fs.existsSync('.gitignore')) {
    console.log('📝 Creating .gitignore...');
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity`;

    fs.writeFileSync('.gitignore', gitignore);
    console.log('✅ .gitignore created');
}

// Create deployment info
const deploymentInfo = {
    name: 'DartScorer',
    version: '1.0.0',
    description: 'Professional dart scoring application with real-time features',
    prepared: new Date().toISOString(),
    platforms: {
        railway: {
            recommended: true,
            cost: 'FREE ($5 monthly credit)',
            features: ['Full Socket.IO', 'No sleep mode', 'Custom domains'],
            url: 'https://railway.app',
            steps: [
                '1. Push to GitHub',
                '2. Connect Railway to GitHub repo',
                '3. Deploy automatically',
                '4. Set NODE_ENV=production'
            ]
        },
        render: {
            cost: 'FREE (750 hours/month)',
            features: ['Full Socket.IO', 'Sleeps after 15min', 'Custom domains'],
            url: 'https://render.com',
            steps: [
                '1. Push to GitHub',
                '2. Create Web Service on Render',
                '3. Set build: npm install && npm run build',
                '4. Set start: npm run start:prod'
            ]
        },
        vercel: {
            cost: 'FREE',
            features: ['Static only', 'No Socket.IO', 'Lightning fast'],
            url: 'https://vercel.com',
            steps: [
                '1. Connect Vercel to GitHub',
                '2. Set framework: Vite',
                '3. Set output: dist',
                '4. Deploy static build'
            ]
        }
    }
};

fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

console.log('\n🎉 Your DartScorer is ready for FREE hosting!');
console.log('\n📋 Next Steps:');
console.log('1. Choose a platform:');
console.log('   🥇 Railway (recommended) - Full features, no sleep');
console.log('   🥈 Render - Full features, sleeps after 15min');
console.log('   🥉 Vercel - Static only, no real-time');
console.log('\n2. Follow the guide in FREE-HOSTING-GUIDE.md');
console.log('3. Push to GitHub if you haven\'t already');
console.log('4. Deploy and enjoy! 🚀');

// Show git status
if (isGitRepo) {
    console.log('\n📊 Git Status:');
    try {
        execSync('git status --porcelain', { stdio: 'inherit' });
    } catch (error) {
        // Ignore errors
    }
}