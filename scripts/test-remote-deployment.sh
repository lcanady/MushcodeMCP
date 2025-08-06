#!/bin/bash

# Test Remote MCP Server Deployment
# Usage: ./scripts/test-remote-deployment.sh [domain] [api-key]

set -e

DOMAIN=${1:-"localhost"}
API_KEY=${2:-""}
PROTOCOL="https"

# If localhost, use http
if [ "$DOMAIN" = "localhost" ]; then
    PROTOCOL="http"
fi

BASE_URL="$PROTOCOL://$DOMAIN"

echo "🧪 Testing Remote MCP Server Deployment"
echo "Domain: $DOMAIN"
echo "Base URL: $BASE_URL"
echo ""

# Function to make API calls
make_request() {
    local endpoint=$1
    local method=${2:-"GET"}
    local data=${3:-""}
    
    local curl_cmd="curl -s -w '%{http_code}'"
    
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    
    if [ -n "$API_KEY" ]; then
        curl_cmd="$curl_cmd -H 'X-API-Key: $API_KEY'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    eval $curl_cmd
}

# Test 1: Health Check
echo "🏥 Testing Health Check..."
response=$(make_request "/health")
http_code=$(echo "$response" | tail -c 4)
body=$(echo "$response" | head -c -4)

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed"
    echo "   Response: $body"
else
    echo "❌ Health check failed (HTTP $http_code)"
    echo "   Response: $body"
    exit 1
fi

echo ""

# Test 2: List Tools
echo "🛠️  Testing Tool Listing..."
response=$(make_request "/api/tools")
http_code=$(echo "$response" | tail -c 4)
body=$(echo "$response" | head -c -4)

if [ "$http_code" = "200" ]; then
    echo "✅ Tool listing successful"
    # Parse and display tools
    tools_count=$(echo "$body" | grep -o '"name"' | wc -l)
    echo "   Found $tools_count tools"
elif [ "$http_code" = "401" ]; then
    echo "❌ Authentication failed - check your API key"
    exit 1
else
    echo "❌ Tool listing failed (HTTP $http_code)"
    echo "   Response: $body"
    exit 1
fi

echo ""

# Test 3: Tool Execution
echo "🚀 Testing Tool Execution..."
test_data='{"arguments": {"description": "Create a simple greeting command", "serverType": "PennMUSH"}}'
response=$(make_request "/api/tools/generate_mushcode" "POST" "$test_data")
http_code=$(echo "$response" | tail -c 4)
body=$(echo "$response" | head -c -4)

if [ "$http_code" = "200" ]; then
    echo "✅ Tool execution successful"
    echo "   Generated MUSHCODE snippet"
elif [ "$http_code" = "401" ]; then
    echo "❌ Authentication failed - check your API key"
    exit 1
else
    echo "❌ Tool execution failed (HTTP $http_code)"
    echo "   Response: $body"
    exit 1
fi

echo ""

# Test 4: SSL Certificate (if HTTPS)
if [ "$PROTOCOL" = "https" ]; then
    echo "🔒 Testing SSL Certificate..."
    
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        echo "✅ SSL certificate is valid"
        
        # Check expiration
        expiry=$(openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        echo "   Expires: $expiry"
    else
        echo "⚠️  SSL certificate check failed (might be self-signed)"
    fi
    
    echo ""
fi

# Test 5: Performance Test
echo "⚡ Testing Performance..."
start_time=$(date +%s%N)
response=$(make_request "/health")
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

echo "✅ Response time: ${duration}ms"

if [ $duration -lt 500 ]; then
    echo "   Performance: Excellent"
elif [ $duration -lt 1000 ]; then
    echo "   Performance: Good"
elif [ $duration -lt 2000 ]; then
    echo "   Performance: Fair"
else
    echo "   Performance: Slow (consider optimization)"
fi

echo ""

# Test 6: Rate Limiting (if enabled)
echo "🚦 Testing Rate Limiting..."
rate_limit_triggered=false

for i in {1..5}; do
    response=$(make_request "/api/tools")
    http_code=$(echo "$response" | tail -c 4)
    
    if [ "$http_code" = "429" ]; then
        rate_limit_triggered=true
        break
    fi
    
    sleep 0.1
done

if [ "$rate_limit_triggered" = true ]; then
    echo "✅ Rate limiting is working"
else
    echo "ℹ️  Rate limiting not triggered (may not be enabled or limit not reached)"
fi

echo ""

# Summary
echo "🎉 Deployment Test Summary"
echo "========================="
echo "✅ Health Check: Passed"
echo "✅ Tool Listing: Passed"
echo "✅ Tool Execution: Passed"
if [ "$PROTOCOL" = "https" ]; then
    echo "✅ SSL Certificate: Checked"
fi
echo "✅ Performance: Tested"
echo "✅ Rate Limiting: Checked"
echo ""
echo "🌟 Your remote MCP server is working correctly!"
echo ""
echo "🔗 Connection Details:"
echo "   Base URL: $BASE_URL"
echo "   Health: $BASE_URL/health"
echo "   API: $BASE_URL/api/tools"
echo "   SSE: $BASE_URL/sse"
echo ""
echo "📚 Next Steps:"
echo "1. Update your AI agent configuration to use: $BASE_URL"
echo "2. Test with your actual AI agent"
echo "3. Monitor performance and logs"
echo "4. Set up regular backups"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   Restart: docker-compose -f docker-compose.production.yml restart"
echo "   Update: git pull && docker-compose -f docker-compose.production.yml up -d --build"