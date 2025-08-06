#!/bin/bash

# MushcodeMCP Server Deployment Script
# Usage: ./deploy/deploy.sh [provider] [domain]
# Example: ./deploy/deploy.sh digitalocean mcp.yourdomain.com

set -e

PROVIDER=${1:-"generic"}
DOMAIN=${2:-"localhost"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 MushcodeMCP Server Deployment"
echo "Provider: $PROVIDER"
echo "Domain: $DOMAIN"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp "$PROJECT_DIR/env.production.example" "$PROJECT_DIR/.env"
    
    # Generate random API key
    API_KEY=$(openssl rand -hex 32)
    REDIS_PASSWORD=$(openssl rand -hex 16)
    GRAFANA_PASSWORD=$(openssl rand -hex 12)
    
    # Update .env file
    sed -i.bak "s/your-super-secret-api-key-change-this/$API_KEY/" "$PROJECT_DIR/.env"
    sed -i.bak "s/your-redis-password-change-this/$REDIS_PASSWORD/" "$PROJECT_DIR/.env"
    sed -i.bak "s/your-grafana-admin-password/$GRAFANA_PASSWORD/" "$PROJECT_DIR/.env"
    sed -i.bak "s/your-domain.com/$DOMAIN/g" "$PROJECT_DIR/.env"
    
    rm "$PROJECT_DIR/.env.bak"
    
    echo "✅ .env file created with random passwords"
    echo "🔑 API Key: $API_KEY"
    echo "🔑 Redis Password: $REDIS_PASSWORD"
    echo "🔑 Grafana Password: $GRAFANA_PASSWORD"
    echo ""
    echo "⚠️  Save these credentials securely!"
    echo ""
fi

# Generate SSL certificates
echo "🔒 Setting up SSL certificates..."
if [ ! -f "$PROJECT_DIR/ssl/cert.pem" ]; then
    mkdir -p "$PROJECT_DIR/ssl"
    
    if [ "$DOMAIN" != "localhost" ]; then
        echo "📋 For production, you should use Let's Encrypt or provide your own SSL certificates."
        echo "   Place your certificates as:"
        echo "   - ssl/cert.pem (certificate)"
        echo "   - ssl/key.pem (private key)"
        echo ""
        echo "🔧 For now, generating self-signed certificates for testing..."
    fi
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_DIR/ssl/key.pem" \
        -out "$PROJECT_DIR/ssl/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    echo "✅ SSL certificates generated"
    echo ""
fi

# Build the Docker image
echo "🏗️  Building Docker image..."
cd "$PROJECT_DIR"
docker-compose -f docker-compose.production.yml build

# Start the services
echo "🚀 Starting MushcodeMCP Server..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f -s "http://localhost/health" > /dev/null; then
    echo "✅ Server is healthy!"
else
    echo "❌ Health check failed. Checking logs..."
    docker-compose -f docker-compose.production.yml logs --tail=20
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps
echo ""
echo "🌐 Your MCP server is available at:"
if [ "$DOMAIN" != "localhost" ]; then
    echo "   - HTTPS: https://$DOMAIN"
    echo "   - HTTP: http://$DOMAIN (redirects to HTTPS)"
else
    echo "   - HTTP: http://localhost"
    echo "   - HTTPS: https://localhost (self-signed certificate)"
fi
echo ""
echo "🔧 API Endpoints:"
echo "   - Health: https://$DOMAIN/health"
echo "   - Tools: https://$DOMAIN/api/tools"
echo "   - SSE: https://$DOMAIN/sse"
echo ""
echo "📈 Monitoring (if enabled):"
echo "   - Prometheus: http://$DOMAIN:9090"
echo "   - Grafana: http://$DOMAIN:3000 (admin:$GRAFANA_PASSWORD)"
echo ""
echo "🔍 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   - Stop server: docker-compose -f docker-compose.production.yml down"
echo "   - Restart: docker-compose -f docker-compose.production.yml restart"
echo ""

# Provider-specific instructions
case $PROVIDER in
    "digitalocean")
        echo "🌊 DigitalOcean specific setup:"
        echo "   1. Make sure your droplet has ports 80 and 443 open"
        echo "   2. Point your domain's A record to your droplet's IP"
        echo "   3. Consider using DigitalOcean's Load Balancer for high availability"
        ;;
    "aws")
        echo "☁️  AWS specific setup:"
        echo "   1. Configure security groups to allow ports 80 and 443"
        echo "   2. Use Route 53 for DNS management"
        echo "   3. Consider using Application Load Balancer"
        echo "   4. Set up CloudWatch for monitoring"
        ;;
    "gcp")
        echo "🌩️  Google Cloud specific setup:"
        echo "   1. Configure firewall rules for HTTP/HTTPS traffic"
        echo "   2. Use Cloud DNS for domain management"
        echo "   3. Consider using Cloud Load Balancing"
        ;;
    "azure")
        echo "⚡ Azure specific setup:"
        echo "   1. Configure Network Security Groups"
        echo "   2. Use Azure DNS for domain management"
        echo "   3. Consider using Application Gateway"
        ;;
esac

echo ""
echo "🔐 Security reminders:"
echo "   1. Change default passwords in .env file"
echo "   2. Use proper SSL certificates for production"
echo "   3. Configure firewall rules"
echo "   4. Regularly update the Docker images"
echo "   5. Monitor logs for suspicious activity"