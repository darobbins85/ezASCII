# Running ASCII Art Generator at Home

## Prerequisites
- Node.js 18+ installed
- Stable internet connection
- Router access (for port forwarding)

## Quick Start

```bash
# 1. Navigate to project directory
cd asciiArtGenerator

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Server runs at `http://localhost:3000`

---

## Making It Accessible Online

### Option A: Local Network Only
Other devices on your WiFi can access via your PC's local IP:
```bash
# Find your local IP (Linux/Mac)
hostname -I | awk '{print $1}'

# Windows
ipconfig
```

Then access from other devices: `http://192.168.x.x:3000`

### Option B: Full Internet Access (Recommended for PayPal)

#### Step 1: Set Static IP on Your PC
```bash
# Linux - set static IP via router or netplan
# Windows - Settings > Network > Properties > Edit IP
```

#### Step 2: Open Port in Firewall
```bash
# Linux (Ubuntu)
sudo ufw allow 3000/tcp

# Windows
# Control Panel > Windows Defender Firewall > Advanced > Inbound Rules > New Rule
```

#### Step 3: Port Forwarding on Router
1. Access your router (usually `192.168.1.1` or `192.168.0.1`)
2. Login (check router label or search online)
3. Find "Port Forwarding" or "Virtual Server"
4. Forward port 3000 to your PC's local IP
5. Save and restart router

#### Step 4: Get Free SSL Certificate (Required for PayPal)

Install Certbot:
```bash
# Linux (Ubuntu)
sudo apt install certbot

# Mac
brew install certbot
```

Get free certificate:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

Update server to use HTTPS (edit server.js):
```javascript
const https = require('https');
const fs = require('fs');

const httpsOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

https.createServer(httpsOptions, app).listen(443);
```

---

## Getting a Domain (Free)

1. **No-IP** (no-ip.com) - Free dynamic DNS
2. **DuckDNS** (duckdns.org) - Free, simple

### Setup DuckDNS:
1. Go to duckdns.org, sign in with Google/GitHub
2. Create subdomain (e.g., `asciiart.duckdns.org`)
3. Install duckdns client or configure router

---

## Auto-Start on Boot (Linux)

```bash
# Create systemd service
sudo nano /etc/systemd/system/ascii-art.service
```

Add this content:
```ini
[Unit]
Description=ASCII Art Generator
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/asciiArtGenerator
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ascii-art
sudo systemctl start ascii-art
```

---

## Monitoring

```bash
# Check logs
pm2 logs ascii-art-generator

# Or if running directly
tail -f server.log
```

---

## Troubleshooting

**Can't access from internet?**
- Check port forwarding is correct
- Try accessing from mobile (not on WiFi) using your public IP
- Find public IP: whatismyip.com

**PayPal not working?**
- MUST have HTTPS/SSL certificate
- Check that domain points to your IP

**Server slow?**
- Reduce max concurrent requests in .env
- Consider upgrading internet upload speed
