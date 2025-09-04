# GET /health

Basic health check untuk API service status.

## Endpoint
```
GET /health
```

## Description
Simple health check endpoint untuk memverifikasi bahwa API service berjalan dengan normal. Tidak melakukan koneksi ke external services.

## Request
Tidak ada parameter yang diperlukan.

## Response

### Success Response (200)
```json
{
  "status": "healthy",
  "service": "vector-indexer"
}
```

## cURL Examples

### Basic Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

### Health Check dengan Timeout
```bash
curl -X GET "http://localhost:8000/health" --max-time 5
```

### Silent Health Check (hanya status code)
```bash
curl -X GET "http://localhost:8000/health" -w "%{http_code}" -o /dev/null -s
```

## Use Cases

### Load Balancer Health Probe
```bash
# Check untuk load balancer configuration
curl -f "http://localhost:8000/health" >/dev/null 2>&1 && echo "UP" || echo "DOWN"
```

### Service Discovery
```bash
# Kubernetes liveness probe
curl -X GET "http://localhost:8000/health"
```

### CI/CD Pipeline
```bash
# Verify deployment success
if curl -s "http://localhost:8000/health" | grep -q "healthy"; then
  echo "✅ Service deployed successfully"
else
  echo "❌ Service deployment failed"
  exit 1
fi
```

### Monitoring Script
```bash
#!/bin/bash
# simple-health-monitor.sh

while true; do
  if curl -s "http://localhost:8000/health" | grep -q "healthy"; then
    echo "$(date): ✅ Service healthy"
  else
    echo "$(date): ❌ Service unhealthy"
  fi
  sleep 30
done
```

## Integration Examples

### Docker Health Check
```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

### Kubernetes Probe
```yaml
# kubernetes deployment
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  
readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Nginx Upstream Health
```nginx
# nginx.conf
upstream vector_indexer {
    server localhost:8000 max_fails=3 fail_timeout=30s;
}

# Health check location
location /health {
    proxy_pass http://vector_indexer/health;
    proxy_set_header Host $host;
}
```

## Response Interpretation

### Status Codes
- **200 OK**: Service berjalan normal
- **Connection refused**: Service tidak berjalan
- **Timeout**: Service responding lambat

### Response Body
```json
{
  "status": "healthy",    // Always "healthy" jika endpoint responding
  "service": "vector-indexer"  // Service identifier
}
```

## Limitations
- Tidak mengecek external dependencies (Pinecone, OpenAI)
- Tidak mengecek database connections
- Tidak memberikan detailed service metrics
- Hanya basic service availability check

## Performance
- Response time: < 10ms
- No external API calls
- Minimal resource usage
- Safe untuk frequent polling

## Comparison dengan /health/pinecone
| Feature | /health | /health/pinecone |
|---------|---------|------------------|
| Speed | Very fast | Slower |
| External deps | None | Pinecone API |
| Information | Basic | Comprehensive |
| Use case | Basic monitoring | Deep health check |

## Best Practices

### Frequent Monitoring
```bash
# Suitable untuk high-frequency checks
watch -n 1 'curl -s http://localhost:8000/health'
```

### Alerting Integration
```bash
# Simple alerting logic
STATUS=$(curl -s "http://localhost:8000/health" -w "%{http_code}" -o /dev/null)
if [ "$STATUS" != "200" ]; then
  echo "ALERT: Vector Indexer API down (HTTP $STATUS)"
  # Send notification
fi
```

### Service Registry
```bash
# Register with service discovery
if curl -s "http://localhost:8000/health" | grep -q "healthy"; then
  # Register service as available
  consul-template -template="service.tpl:service.json"
fi
```

## Related Endpoints
- `GET /health/pinecone` - Comprehensive health check with Pinecone
- `GET /` - Root endpoint dengan service info