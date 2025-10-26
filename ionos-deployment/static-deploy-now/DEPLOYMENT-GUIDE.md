# DartScorer - IONOS Deploy Now (Static Version)

## Overview
This guide covers deploying a simplified static version of DartScorer to IONOS Deploy Now (shared hosting).

⚠️ **Limitations**: This version will NOT have real-time features, Socket.IO, or server-side functionality.

## What Works in Static Version:
- ✅ Dart scoring interface
- ✅ Game setup and configuration
- ✅ Local scoring (browser-only)
- ✅ Mobile and desktop views
- ✅ All UI features

## What Doesn't Work:
- ❌ Real-time synchronization between devices
- ❌ Server-side game state management
- ❌ Multi-device connectivity
- ❌ Persistent game data

## Deployment Steps

### Step 1: Prepare Static Build

1. **Modify the application for static deployment**:
   - Remove Socket.IO client connections
   - Use local storage for game state
   - Disable server-dependent features

2. **Build static version**:
   ```bash
   npm run build
   ```

### Step 2: Deploy to IONOS Deploy Now

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Connect IONOS Deploy Now to your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Node Version**: 18.x

#### Option B: Manual Upload
1. Log into IONOS Deploy Now
2. Create new project
3. Upload the contents of your `dist` folder
4. Configure domain settings

### Step 3: Configuration

Create a `deploy-now.yml` file in your project root:

```yaml
# .github/workflows/deploy-now.yml
name: Deploy to IONOS Deploy Now
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to IONOS
        uses: ionos-deploy-now/deploy-to-ionos-action@v1
        with:
          api-key: ${{ secrets.IONOS_API_KEY }}
          service-host: api-eu.ionos.space
          project: ${{ secrets.IONOS_PROJECT_ID }}
          dist-folder: dist
```

## Cost
- **FREE** with IONOS Deploy Now

## Recommendation
For the full DartScorer experience with real-time features, I recommend **Option 1 (VPS)** as it preserves all the advanced functionality you've built.