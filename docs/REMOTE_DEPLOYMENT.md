# Remote MCP Server Deployment Guide

This guide explains how to deploy your MushcodeMCP server to various cloud platforms for remote access.

## 🚀 Quick Start

### Option 1: DigitalOcean Droplet (Recommended)

**Prerequisites:**
- DigitalOcean account
- Domain name pointed to your droplet
- SSH access to your droplet

**Steps:**
1. Create a new Ubuntu 22.04 droplet (minimum 2GB RAM)
2. SSH into your droplet
3. Run the setup script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/your-username/MushcodeMCP/main/deploy/digitalocean/setup-droplet.sh | bash
   ```
4. Copy your code to `/opt/mushcode-mcp/`
5. Deploy:
   ```bash
   cd /opt/mushcode-mcp
   ./deploy/deploy.sh digitalocean your-domain.com
   ```
6. Set up SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: Generic Linux Server

**For any Linux server with Docker:**
```bash
# Clone your repository
git clone https://github.com/your-username/MushcodeMCP.git
cd MushcodeMCP

# Run deployment script
./deploy/deploy.sh generic your-domain.com
```

## 🌐 Deployment Options

### 1. Docker Compose (Recommended)

**Production deployment with SSL and monitoring:**
```bash
# Copy environment template
cp env.production.example .env

# Edit .env with your settings
nano .env

# Deploy
docker-compose -f docker-compose.production.yml up -d
```

**Services included:**
- ✅ MushcodeMCP Server (network mode)
- ✅ Nginx reverse proxy with SSL
- ✅ Redis for caching
- ✅ Prometheus monitoring
- ✅ Grafana dashboards

### 2. AWS CloudFormation

**Deploy to AWS with auto-scaling:**
```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name mushcode-mcp-server \
  --template-body file://deploy/aws/cloudformation.yml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=mcp.yourdomain.com \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:region:account:certificate/cert-id \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=VpcId,ParameterValue=vpc-12345678 \
    ParameterKey=SubnetIds,ParameterValue=subnet-12345678,subnet-87654321 \
  --capabilities CAPABILITY_IAM
```

**Features:**
- ✅ Application Load Balancer
- ✅ Auto Scaling Group
- ✅ CloudWatch monitoring
- ✅ SSL termination
- ✅ Health checks

### 3. Kubernetes

**Deploy to any Kubernetes cluster:**
```bash
# Update the configuration
nano deploy/kubernetes/mushcode-mcp.yaml

# Deploy
kubectl apply -f deploy/kubernetes/mushcode-mcp.yaml
```

**Features:**
- ✅ Horizontal Pod Autoscaling
- ✅ Rolling deployments
- ✅ Persistent storage
- ✅ Ingress with SSL
- ✅ Pod disruption budgets

## 🔒 Security Configuration

### Environment Variables

Create a `.env` file with these security settings:

```bash
# API Security
API_KEY=your-super-secret-api-key-change-this
REDIS_PASSWORD=your-redis-password-change-this

# Domain and CORS
DOMAIN=your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### SSL Certificates

**Option 1: Let's Encrypt (Free)**
```bash
sudo certbot --nginx -d your-domain.com
```

**Option 2: Custom certificates**
```bash
# Place your certificates in the ssl/ directory
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

### Firewall Configuration

**UFW (Ubuntu):**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**AWS Security Groups:**
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
- SSH (22) from your IP only

## 📊 Monitoring and Logging

### Prometheus Metrics

Access metrics at: `https://your-domain.com:9090`

**Key metrics to monitor:**
- HTTP request rate and duration
- Memory and CPU usage
- Error rates
- Cache hit rates

### Grafana Dashboards

Access dashboards at: `https://your-domain.com:3000`

**Default credentials:**
- Username: `admin`
- Password: Set in your `.env` file

### Log Management

**View logs:**
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f mushcode-mcp-server
```

**Log rotation is configured automatically.**

## 🔧 Maintenance

### Updates

**Update the server:**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Health Checks

**Manual health check:**
```bash
curl https://your-domain.com/health
```

**Automated monitoring script runs every 5 minutes and:**
- Restarts containers if they're down
- Cleans up disk space if usage > 85%
- Logs system status

### Backup

**Backup important data:**
```bash
# Backup volumes
docker run --rm -v mushcodemcp_mushcode-logs:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz -C /data .
docker run --rm -v mushcodemcp_mushcode-cache:/data -v $(pwd):/backup alpine tar czf /backup/cache-backup.tar.gz -C /data .
```

## 🌍 DNS Configuration

### A Record
Point your domain to your server's IP:
```
Type: A
Name: mcp (or @)
Value: YOUR_SERVER_IP
TTL: 300
```

### CNAME (if using load balancer)
```
Type: CNAME
Name: mcp
Value: your-load-balancer-dns-name
TTL: 300
```

## 🔍 Troubleshooting

### Common Issues

**1. SSL Certificate Issues**
```bash
# Check certificate
openssl x509 -in ssl/cert.pem -text -noout

# Renew Let's Encrypt
sudo certbot renew
```

**2. Container Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs mushcode-mcp-server

# Check configuration
docker-compose -f docker-compose.production.yml config
```

**3. High Memory Usage**
```bash
# Check container stats
docker stats

# Restart if needed
docker-compose -f docker-compose.production.yml restart
```

**4. Connection Issues**
```bash
# Test connectivity
curl -v https://your-domain.com/health

# Check firewall
sudo ufw status
```

### Performance Tuning

**For high traffic:**
1. Increase container resources in docker-compose.yml
2. Enable Redis caching
3. Use a CDN for static content
4. Scale horizontally with multiple instances

**Memory optimization:**
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

## 📱 Client Configuration

### Connect Your AI Agent

**REST API:**
```javascript
const client = new MushcodeMCPClient('https://your-domain.com');
await client.callTool('generate_mushcode', {
  description: 'Create a room',
  serverType: 'PennMUSH'
});
```

**With API Key:**
```javascript
fetch('https://your-domain.com/api/tools/generate_mushcode', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    arguments: {
      description: 'Create a room',
      serverType: 'PennMUSH'
    }
  })
});
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "mushcode-mcp-server": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "X-API-Key: your-api-key",
        "https://your-domain.com/api/tools/generate_mushcode"
      ]
    }
  }
}
```

## 💰 Cost Estimation

### DigitalOcean
- **Basic Droplet (2GB RAM):** $12/month
- **Premium Droplet (4GB RAM):** $24/month
- **Load Balancer (optional):** $12/month

### AWS
- **t3.medium instance:** ~$30/month
- **Application Load Balancer:** ~$22/month
- **Data transfer:** Variable

### Google Cloud
- **e2-medium instance:** ~$25/month
- **Load Balancer:** ~$18/month

**Recommendation:** Start with a DigitalOcean Basic Droplet for development and testing.

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review logs: `docker-compose logs -f`
3. Test connectivity: `curl https://your-domain.com/health`
4. Check monitoring dashboards
5. Open an issue on GitHub with logs and configuration

Your remote MCP server should now be accessible worldwide! 🌍