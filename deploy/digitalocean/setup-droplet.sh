#!/bin/bash

# DigitalOcean Droplet Setup for MushcodeMCP Server
# Run this script on a fresh Ubuntu 22.04 droplet

set -e

echo "🌊 Setting up DigitalOcean Droplet for MushcodeMCP Server"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
echo "🛠️  Installing additional tools..."
sudo apt install -y curl wget git htop ufw certbot python3-certbot-nginx

# Configure firewall
echo "🔥 Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/mushcode-mcp
sudo chown $USER:$USER /opt/mushcode-mcp

# Clone repository (you'll need to replace this with your actual repo)
echo "📥 Cloning repository..."
cd /opt/mushcode-mcp
# git clone https://github.com/your-username/MushcodeMCP.git .

echo ""
echo "✅ Droplet setup completed!"
echo ""
echo "🔄 Next steps:"
echo "1. Copy your MushcodeMCP code to /opt/mushcode-mcp/"
echo "2. Run: cd /opt/mushcode-mcp && ./deploy/deploy.sh digitalocean your-domain.com"
echo "3. Set up Let's Encrypt SSL: sudo certbot --nginx -d your-domain.com"
echo ""
echo "🌐 Your droplet is ready for MushcodeMCP deployment!"

# Optional: Set up automatic security updates
echo "🔒 Setting up automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create a simple monitoring script
cat > /opt/mushcode-mcp/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for MushcodeMCP

cd /opt/mushcode-mcp

# Check if containers are running
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "⚠️  Some containers are down. Restarting..."
    docker-compose -f docker-compose.production.yml up -d
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "⚠️  Disk usage is at ${DISK_USAGE}%. Consider cleaning up."
    docker system prune -f
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "⚠️  Memory usage is at ${MEMORY_USAGE}%. Consider upgrading."
fi

echo "✅ System check completed at $(date)"
EOF

chmod +x /opt/mushcode-mcp/monitor.sh

# Add monitoring to crontab
echo "⏰ Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/mushcode-mcp/monitor.sh >> /var/log/mushcode-monitor.log 2>&1") | crontab -

echo "✅ Monitoring script installed (runs every 5 minutes)"