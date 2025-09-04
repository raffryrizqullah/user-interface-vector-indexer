# GET /health/pinecone

Comprehensive health check dengan Pinecone connection dan index status.

## Endpoint
```
GET /health/pinecone
```

## Description
Deep health check yang memverifikasi koneksi ke Pinecone, status index, dan konfigurasi sistem. Memberikan informasi detail tentang kesehatan keseluruhan system.

## Request
Tidak ada parameter yang diperlukan.

## Response

### Success Response (200)
```json
{
  "success": true,
  "message": "Pinecone read connection successful",
  "index_name": "standard-dense-py",
  "index_stats": "{'dimension': 3072, 'index_fullness': 0.0, 'namespaces': {'default': {'vector_count': 4}}, 'total_vector_count': 4}",
  "config": {
    "index_name": "standard-dense-py",
    "namespace": "default",
    "dimension": 3072
  }
}
```

### Error Response (200)
```json
{
  "success": false,
  "message": "Pinecone health check failed: Authentication error",
  "error": "Invalid API key or insufficient permissions"
}
```

## cURL Examples

### Basic Pinecone Health Check
```bash
curl -X GET "http://localhost:8000/health/pinecone"
```

### Health Check dengan Pretty Output
```bash
curl -X GET "http://localhost:8000/health/pinecone" | jq
```

### Quick Success Check
```bash
curl -s "http://localhost:8000/health/pinecone" | jq '.success'
```

### Extract Index Information
```bash
curl -s "http://localhost:8000/health/pinecone" | jq '{
  index: .index_name,
  dimension: .config.dimension,
  success: .success
}'
```

## Use Cases

### Deployment Verification
```bash
# Verify semua connections setelah deployment
echo "Checking Pinecone connectivity..."
RESPONSE=$(curl -s "http://localhost:8000/health/pinecone")
SUCCESS=$(echo $RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  INDEX=$(echo $RESPONSE | jq -r '.index_name')
  DIMENSION=$(echo $RESPONSE | jq -r '.config.dimension')
  echo "✅ Connected to index: $INDEX (dimension: $DIMENSION)"
else
  ERROR=$(echo $RESPONSE | jq -r '.error')
  echo "❌ Connection failed: $ERROR"
  exit 1
fi
```

### Pre-flight Checks
```bash
# Check sebelum upload documents
if ! curl -s "http://localhost:8000/health/pinecone" | jq -e '.success' >/dev/null; then
  echo "❌ Pinecone not available, aborting upload"
  exit 1
fi
echo "✅ Pinecone ready, proceeding with upload"
```

### Index Statistics Monitoring
```bash
# Extract dan monitor index statistics
curl -s "http://localhost:8000/health/pinecone" \
  | jq -r '.index_stats' \
  | python3 -c "
import sys, ast
stats = ast.literal_eval(sys.stdin.read())
print(f'Vectors: {stats[\"total_vector_count\"]}')
print(f'Fullness: {stats[\"index_fullness\"] * 100:.1f}%')
print(f'Namespaces: {list(stats[\"namespaces\"].keys())}')
"
```

### Configuration Validation
```bash
# Validate configuration matches expectations
EXPECTED_DIM=3072
ACTUAL_DIM=$(curl -s "http://localhost:8000/health/pinecone" | jq '.config.dimension')

if [ "$ACTUAL_DIM" = "$EXPECTED_DIM" ]; then
  echo "✅ Dimension configuration correct ($ACTUAL_DIM)"
else
  echo "❌ Dimension mismatch: expected $EXPECTED_DIM, got $ACTUAL_DIM"
fi
```

## Detailed Response Analysis

### Success Response Fields
| Field | Description |
|-------|-------------|
| `success` | Boolean status of overall health |
| `message` | Human-readable status message |
| `index_name` | Pinecone index name |
| `index_stats` | Raw index statistics dari Pinecone |
| `config.dimension` | Vector dimension configuration |
| `config.namespace` | Default namespace configuration |

### Error Response Fields
| Field | Description |
|-------|-------------|
| `success` | Always false untuk errors |
| `message` | Error description |
| `error` | Detailed error information |

## Health Check Scenarios

### Healthy System
```bash
curl -s "http://localhost:8000/health/pinecone" | jq '{
  status: (if .success then "HEALTHY" else "UNHEALTHY" end),
  index: .index_name,
  vectors: (.index_stats | fromjson | .total_vector_count),
  message: .message
}'
```

### Connection Issues
```bash
# Handle various connection failures
RESPONSE=$(curl -s "http://localhost:8000/health/pinecone")
SUCCESS=$(echo $RESPONSE | jq -r '.success')

case $SUCCESS in
  "true")
    echo "✅ All systems operational"
    ;;
  "false")
    ERROR=$(echo $RESPONSE | jq -r '.error // .message')
    case $ERROR in
      *"Authentication"*|*"API key"*)
        echo "🔑 Authentication error - check API key"
        ;;
      *"timeout"*|*"connection"*)
        echo "🌐 Network connectivity issue"
        ;;
      *"not found"*|*"index"*)
        echo "📊 Index configuration problem"
        ;;
      *)
        echo "❌ Unknown error: $ERROR"
        ;;
    esac
    ;;
esac
```

## Monitoring Integration

### Prometheus Metrics Export
```bash
# Export untuk Prometheus monitoring
curl -s "http://localhost:8000/health/pinecone" | jq -r '
  if .success then
    "pinecone_health_status 1\n" +
    "pinecone_vector_count " + (.index_stats | fromjson | .total_vector_count | tostring) + "\n" +
    "pinecone_index_fullness " + (.index_stats | fromjson | .index_fullness | tostring)
  else
    "pinecone_health_status 0"
  end
'
```

### Grafana Dashboard Query
```bash
# Health over time untuk Grafana
while true; do
  TIMESTAMP=$(date +%s)
  HEALTH=$(curl -s "http://localhost:8000/health/pinecone" | jq '.success')
  echo "$TIMESTAMP,pinecone_health,$HEALTH"
  sleep 60
done
```

### Alerting Script
```bash
#!/bin/bash
# pinecone-health-alert.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

check_health() {
  local response=$(curl -s "http://localhost:8000/health/pinecone")
  local success=$(echo $response | jq -r '.success')
  
  if [ "$success" != "true" ]; then
    local error=$(echo $response | jq -r '.error // .message')
    curl -X POST $WEBHOOK_URL \
      -H 'Content-type: application/json' \
      --data "{\"text\":\"🚨 Pinecone Health Check Failed: $error\"}"
  fi
}

# Run every 5 minutes
while true; do
  check_health
  sleep 300
done
```

## Performance Considerations

### Response Time
- Typical: 100-500ms (network dependent)
- Involves real Pinecone API call
- May timeout in network issues

### Rate Limiting
```bash
# Be mindful of Pinecone rate limits
# Don't check more than once per minute untuk production
sleep 60 && curl -s "http://localhost:8000/health/pinecone"
```

### Caching Strategy
```bash
# Cache results untuk frequent checks
CACHE_FILE="/tmp/pinecone_health_cache"
CACHE_TTL=60  # 1 minute

if [ ! -f "$CACHE_FILE" ] || [ $(($(date +%s) - $(stat -c %Y "$CACHE_FILE"))) -gt $CACHE_TTL ]; then
  curl -s "http://localhost:8000/health/pinecone" > "$CACHE_FILE"
fi
cat "$CACHE_FILE"
```

## Troubleshooting Guide

### Common Issues

#### API Key Problems
```bash
# Verify API key format
curl -s "http://localhost:8000/health/pinecone" | jq '.error' | grep -i "auth"
```

#### Index Not Found
```bash
# Check index name configuration
curl -s "http://localhost:8000/health/pinecone" | jq '.error' | grep -i "index"
```

#### Network Issues
```bash
# Test with timeout
timeout 10 curl -s "http://localhost:8000/health/pinecone" || echo "Network timeout"
```

## Related Endpoints
- `GET /health` - Basic service health (faster)
- `GET /namespaces/{namespace}/stats` - Detailed namespace information
- `POST /create-index` - Create index jika tidak ada