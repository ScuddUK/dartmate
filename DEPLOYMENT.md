# DartScorer Deployment Guide

## Overview
DartScorer is a professional dart scoring application with a TV scoreboard view and mobile input interface. This guide covers deployment options for testing on websites.

## Quick Start (Production)

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Setup
1. Extract the application files to your server
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production version:
   ```bash
   npm run build
   ```
4. Start the production server:
   ```bash
   # For Linux/Mac:
   npm start
   
   # For Windows:
   npm run start:windows
   ```

The application will be available at `http://localhost:3001` (or your configured port).

## Environment Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (default: 3001)

### Production Settings
The application automatically serves the built React app when `NODE_ENV=production`.

## Deployment Options

### 1. Traditional Web Server
- Build the application: `npm run build`
- Copy the `dist/` folder contents to your web server
- Set up a Node.js server to serve the backend API and Socket.IO

### 2. Platform-as-a-Service (PaaS)
Compatible with:
- Heroku
- Railway
- Render
- Vercel (with serverless functions)
- Netlify (with serverless functions)

### 3. VPS/Cloud Server
- Upload the entire project
- Install Node.js and npm
- Run the installation and build commands
- Use PM2 or similar for process management

## File Structure
```
DartScorer/
├── dist/                 # Built React application (generated)
├── server/              # Backend server
│   └── index.js        # Main server file
├── src/                # React source code
├── package.json        # Dependencies and scripts
└── DEPLOYMENT.md       # This file
```

## Features
- **Game Settings**: Configurable player names, starting scores, game formats
- **Set/Leg System**: Support for both legs-only and sets+legs formats
- **Dual Interface**: TV scoreboard view and mobile input interface
- **Real-time Updates**: Socket.IO for live score updates
- **Responsive Design**: Optimized for desktop and mobile devices

## Testing
1. Access the application in your browser
2. Configure game settings (player names, format, etc.)
3. Test both scoreboard and mobile views
4. Verify real-time score updates work correctly

## Troubleshooting
- Ensure port 3001 is available and not blocked by firewall
- Check that all dependencies are installed correctly
- Verify Node.js version compatibility
- Check browser console for any client-side errors

## Support
For issues or questions, check the application logs and ensure all dependencies are properly installed.