# GET /records/fetch

Fetch detail vector records berdasarkan specific IDs dengan metadata lengkap.

## Endpoint
```
GET /records/fetch
```

## Description
Endpoint ini mengambil detail lengkap dari vector records berdasarkan ID yang spesifik. Mengembalikan metadata lengkap dan opsional vector values.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | String | ✅ | Comma-separated list of vector IDs |
| `namespace` | String | ❌ | Namespace (default: "default") |
| `include_metadata` | Boolean | ❌ | Include metadata (default: true) |
| `include_values` | Boolean | ❌ | Include vector values (default: false) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "requested_ids": [
    "document.pdf_0_abc123",
    "document.pdf_1_def456"
  ],
  "found_ids": [
    "document.pdf_0_abc123", 
    "document.pdf_1_def456"
  ],
  "vectors": {
    "document.pdf_0_abc123": {
      "id": "document.pdf_0_abc123",
      "metadata": {
        "document_id": "12345678-1234-1234-1234-123456789abc",
        "document_title": "Document",
        "chunk_number": 1,
        "chunk_text": "This is the first chunk of text...",
        "created_at": "2025-08-21T23:51:14.090648+00:00",
        "author": "John Doe",
        "category": "tutorial"
      }
    }
  },
  "found_count": 2,
  "requested_count": 2,
  "include_metadata": true,
  "include_values": false,
  "usage": {
    "read_units": 1
  }
}
```

### Error Response (400/500)
```json
{
  "detail": "No valid vector IDs provided"
}
```

## cURL Examples

### Fetch Single Record
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=document.pdf_0_abc123"
```

### Fetch Multiple Records
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=doc1.pdf_0_abc123,doc1.pdf_1_def456,doc2.pdf_0_ghi789"
```

### Fetch dengan Namespace Specific
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=tutorial.pdf_0_abc123&namespace=production"
```

### Fetch dengan Vector Values
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=document.pdf_0_abc123&include_values=true"
```

### Fetch Metadata Only
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=document.pdf_0_abc123&include_metadata=true&include_values=false"
```

## Use Cases

### Content Retrieval
```bash
# Get original text dari specific chunks
curl -X GET "http://localhost:8000/records/fetch?ids=manual.pdf_0_abc123,manual.pdf_1_def456" \
  | jq '.vectors[].metadata.chunk_text'
```

### Metadata Analysis
```bash
# Check document information
curl -X GET "http://localhost:8000/records/fetch?ids=document.pdf_0_abc123" \
  | jq '.vectors[].metadata | {document_title, author, created_at}'
```

### Vector Debugging
```bash
# Get vector values untuk analysis
curl -X GET "http://localhost:8000/records/fetch?ids=test.pdf_0_abc123&include_values=true" \
  | jq '.vectors[].values | length'
```

### Batch Processing
```bash
# Process multiple chunks sekaligus
curl -X GET "http://localhost:8000/records/fetch?ids=$(curl -s 'http://localhost:8000/records?prefix=document.pdf&limit=5' | jq -r '.vector_ids | join(",")')"
```

## Response Structure

### Vector Object
```json
{
  "id": "document.pdf_0_abc123",
  "metadata": {
    // Required metadata
    "document_id": "uuid",
    "document_title": "formatted title",
    "chunk_number": 1,
    "chunk_text": "actual content",
    "created_at": "timestamp",
    
    // Custom metadata (if any)
    "author": "John Doe",
    "category": "tutorial",
    "tags": ["guide", "beginner"]
  },
  "values": [0.1, 0.2, 0.3, ...] // Only if include_values=true
}
```

## Limitations
- Maximum 100 IDs per request
- Vector values array sangat besar (3072 dimensions)
- Missing IDs tidak akan return error, hanya tidak ada dalam response
- Read units charged per request, bukan per vector

## Error Handling

### Invalid IDs
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=invalid-id"
# Returns: found_count: 0, requested_count: 1
```

### Too Many IDs
```bash
curl -X GET "http://localhost:8000/records/fetch?ids=$(seq 1 101 | paste -sd,)"
# Returns: 400 "Maximum 100 IDs allowed per request"
```

### Empty IDs
```bash
curl -X GET "http://localhost:8000/records/fetch?ids="
# Returns: 400 "No valid vector IDs provided"
```

## Performance Tips
- Batch multiple IDs dalam single request untuk efisiensi
- Set `include_values=false` jika tidak butuh vector data
- Use `include_metadata=false` untuk speed jika hanya butuh existence check
- Cache results untuk IDs yang sering diakses

## Related Endpoints
- `GET /records` - List available IDs
- `GET /records/search` - Find IDs by prefix pattern
- `GET /namespaces/{namespace}/stats` - Check namespace info