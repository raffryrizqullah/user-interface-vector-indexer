# GET /namespaces/{namespace}/stats

Get statistics dan informasi untuk specific namespace.

## Endpoint
```
GET /namespaces/{namespace}/stats
```

## Description
Endpoint ini memberikan informasi statistik lengkap tentang namespace termasuk jumlah vectors, dimensi index, dan namespace availability.

## Request

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | ✅ | Nama namespace yang ingin dicek |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "stats": {
    "vector_count": 156,
    "index_dimension": 3072,
    "index_fullness": 0.02,
    "total_vector_count": 156
  },
  "all_namespaces": [
    "default",
    "production", 
    "testing"
  ],
  "namespace_exists": true
}
```

### Namespace Not Found (200)
```json
{
  "success": true,
  "namespace": "nonexistent",
  "stats": {
    "vector_count": 0,
    "index_dimension": 3072,
    "index_fullness": 0.02,
    "total_vector_count": 156
  },
  "all_namespaces": [
    "default",
    "production"
  ],
  "namespace_exists": false
}
```

## cURL Examples

### Check Default Namespace
```bash
curl -X GET "http://localhost:8000/namespaces/default/stats"
```

### Check Production Namespace
```bash
curl -X GET "http://localhost:8000/namespaces/production/stats"
```

### Check Testing Environment
```bash
curl -X GET "http://localhost:8000/namespaces/testing/stats"
```

### Check Non-existent Namespace
```bash
curl -X GET "http://localhost:8000/namespaces/development/stats"
```

## Use Cases

### Environment Monitoring
```bash
# Check production vector count
curl -X GET "http://localhost:8000/namespaces/production/stats" \
  | jq '.stats.vector_count'

# Monitor index fullness
curl -X GET "http://localhost:8000/namespaces/default/stats" \
  | jq '.stats.index_fullness'
```

### Deployment Verification
```bash
# Verify namespace exists sebelum deployment
curl -X GET "http://localhost:8000/namespaces/staging/stats" \
  | jq '.namespace_exists'

# Check if data sudah ada
curl -X GET "http://localhost:8000/namespaces/production/stats" \
  | jq 'if .stats.vector_count > 0 then "Data exists" else "Empty namespace" end'
```

### Capacity Planning
```bash
# Check index capacity utilization
curl -X GET "http://localhost:8000/namespaces/default/stats" \
  | jq '{
      vector_count: .stats.vector_count,
      fullness_percent: (.stats.index_fullness * 100),
      dimension: .stats.index_dimension
    }'
```

### Multi-namespace Management
```bash
# Get all namespace names
curl -X GET "http://localhost:8000/namespaces/default/stats" \
  | jq '.all_namespaces[]'

# Compare namespace sizes
for ns in default production testing; do
  count=$(curl -s "http://localhost:8000/namespaces/$ns/stats" | jq '.stats.vector_count')
  echo "$ns: $count vectors"
done
```

## Statistics Fields

### Vector Count
- **vector_count**: Jumlah vectors dalam namespace ini
- **total_vector_count**: Total vectors di semua namespaces dalam index

### Index Information  
- **index_dimension**: Dimensi vector (3072 untuk OpenAI text-embedding-3-large)
- **index_fullness**: Persentase kapasitas index yang terpakai (0.0-1.0)

### Namespace Information
- **namespace_exists**: Boolean apakah namespace ada
- **all_namespaces**: Array semua namespace yang ada dalam index

## Monitoring Examples

### Health Check Script
```bash
#!/bin/bash
# check-namespace-health.sh

NAMESPACE=${1:-default}
RESPONSE=$(curl -s "http://localhost:8000/namespaces/$NAMESPACE/stats")

# Check if namespace exists
EXISTS=$(echo $RESPONSE | jq '.namespace_exists')
if [ "$EXISTS" = "false" ]; then
  echo "❌ Namespace '$NAMESPACE' does not exist"
  exit 1
fi

# Get stats
VECTOR_COUNT=$(echo $RESPONSE | jq '.stats.vector_count')
FULLNESS=$(echo $RESPONSE | jq '.stats.index_fullness')

echo "✅ Namespace: $NAMESPACE"
echo "📊 Vector count: $VECTOR_COUNT"
echo "💾 Index fullness: $(echo "$FULLNESS * 100" | bc)%"
```

### Capacity Alert
```bash
# Alert jika index fullness > 80%
curl -s "http://localhost:8000/namespaces/production/stats" \
  | jq 'if .stats.index_fullness > 0.8 then "⚠️ WARNING: Index " + (.stats.index_fullness * 100 | tostring) + "% full" else "✅ Index capacity OK" end'
```

### Compare Environments
```bash
# Compare vector counts across environments
echo "Environment Vector Counts:"
echo "========================="
for env in default staging production; do
  count=$(curl -s "http://localhost:8000/namespaces/$env/stats" | jq '.stats.vector_count // 0')
  exists=$(curl -s "http://localhost:8000/namespaces/$env/stats" | jq '.namespace_exists')
  status=$([ "$exists" = "true" ] && echo "✅" || echo "❌")
  printf "%-12s %s %6d vectors\n" "$env:" "$status" "$count"
done
```

## Integration Examples

### Grafana/Prometheus Monitoring
```bash
# Export metrics untuk monitoring systems
curl -s "http://localhost:8000/namespaces/production/stats" \
  | jq '{
      vector_count: .stats.vector_count,
      index_fullness: .stats.index_fullness,
      namespace_exists: .namespace_exists
    }' \
  | jq -r 'to_entries[] | "pinecone_" + .key + " " + (.value | tostring)'
```

### CI/CD Pipeline Check
```bash
# Pre-deployment validation
REQUIRED_VECTORS=100
CURRENT_COUNT=$(curl -s "http://localhost:8000/namespaces/production/stats" | jq '.stats.vector_count')

if [ "$CURRENT_COUNT" -lt "$REQUIRED_VECTORS" ]; then
  echo "❌ Production has only $CURRENT_COUNT vectors, minimum $REQUIRED_VECTORS required"
  exit 1
else
  echo "✅ Production ready with $CURRENT_COUNT vectors"
fi
```

## Error Handling

### Network Issues
```bash
# Handle timeout atau connection errors
timeout 10 curl -X GET "http://localhost:8000/namespaces/default/stats" \
  || echo "❌ API tidak responding"
```

### Invalid Response
```bash
# Validate response structure
RESPONSE=$(curl -s "http://localhost:8000/namespaces/default/stats")
if echo "$RESPONSE" | jq '.success' >/dev/null 2>&1; then
  echo "✅ Valid response"
else
  echo "❌ Invalid JSON response"
fi
```

## Related Endpoints
- `GET /records` - List vectors dalam namespace
- `GET /health/pinecone` - Overall index health
- `POST /create-records` - Add data to namespace