# DartScorer - IONOS VPS Deployment Guide

## Overview
This guide covers deploying your full DartScorer application (with real-time features) to an IONOS VPS or Cloud Server.

## Prerequisites
- IONOS VPS or Cloud Server (not shared hosting)
- SSH access to your server
- Domain name (optional but recommended)

## Step 1: Prepare Your IONOS VPS

### 1.1 Order IONOS VPS
1. Log into your IONOS account
2. Navigate to "Cloud Server" or "VPS" section
3. Choose a plan (minimum: 1GB RAM, 1 CPU core)
4. Select Ubuntu 20.04 or 22.04 LTS as the operating system
5. Complete the setup and note your server IP and SSH credentials

### 1.2 Connect to Your Server
```bash
ssh root@your-server-ip
# Or use the credentials provided by IONOS
```

## Step 2: Server Setup

### 2.1 Update System
```bash
apt update && apt upgrade -y
```

### 2.2 Install Node.js
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.3 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 2.4 Install Nginx (Web Server)
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

## Step 3: Deploy Your Application

### 3.1 Upload Application Files
You can use SCP, SFTP, or Git to upload your files:

**Option A: Using SCP**
```bash
# From your local machine
scp -r /path/to/DartScorer root@your-server-ip:/var/www/
```

**Option B: Using Git (Recommended)**
```bash
# On your server
cd /var/www
git clone https://github.com/yourusername/DartScorer.git
# Or upload via FTP and extract
```

### 3.2 Install Dependencies
```bash
cd /var/www/DartScorer
npm install
```

### 3.3 Build Production Version
```bash
npm run build
```

### 3.4 Configure Environment
```bash
# Create environment file
echo "NODE_ENV=production" > .env
echo "PORT=3001" >> .env
```

## Step 4: Configure PM2

### 4.1 Create PM2 Configuration
```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
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
}
EOF
```

### 4.2 Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration
```bash
cat > /etc/nginx/sites-available/dartscorer << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Handle Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 5.2 Enable Site
```bash
ln -s /etc/nginx/sites-available/dartscorer /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl reload nginx
```

## Step 6: Configure Firewall
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (for SSL later)
ufw enable
```

## Step 7: SSL Certificate (Optional but Recommended)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 8: Domain Configuration

### 8.1 Point Domain to Server
In your IONOS domain management:
1. Go to DNS settings
2. Create/update A record: `@` → `your-server-ip`
3. Create/update A record: `www` → `your-server-ip`

## Testing Your Deployment

1. **Check PM2 Status**: `pm2 status`
2. **Check Nginx Status**: `systemctl status nginx`
3. **Check Application Logs**: `pm2 logs dartscorer`
4. **Test in Browser**: Visit `http://your-domain.com` or `http://your-server-ip`

## Maintenance Commands

```bash
# Restart application
pm2 restart dartscorer

# View logs
pm2 logs dartscorer

# Update application
cd /var/www/DartScorer
git pull  # If using Git
npm install
npm run build
pm2 restart dartscorer

# Monitor resources
pm2 monit
```

## Troubleshooting

### Common Issues:
1. **Port 3001 blocked**: Check firewall settings
2. **Permission errors**: Ensure proper file ownership: `chown -R www-data:www-data /var/www/DartScorer`
3. **Node.js not found**: Verify Node.js installation path
4. **Socket.IO not working**: Check Nginx proxy configuration

### Useful Commands:
```bash
# Check if port is listening
netstat -tlnp | grep 3001

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check system resources
htop
```

## Cost Estimate
- IONOS VPS S: ~€4-8/month
- IONOS VPS M: ~€8-15/month (recommended for better performance)

Your DartScorer application will be fully functional with real-time scoring, mobile input, and TV scoreboard features!