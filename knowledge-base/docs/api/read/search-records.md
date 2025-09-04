# GET /records/search

Search vectors berdasarkan ID prefix pattern dengan metadata retrieval.

## Endpoint
```
GET /records/search
```

## Description
Endpoint ini menggabungkan list IDs by prefix dengan fetch metadata dalam satu operasi. Cocok untuk structured ID searching dan content discovery.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prefix` | String | ✅ | ID prefix pattern untuk search |
| `namespace` | String | ❌ | Namespace (default: "default") |
| `limit` | Integer | ❌ | Max results (default: 100, max: 1000) |
| `fetch_metadata` | Boolean | ❌ | Fetch metadata (default: true) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "prefix": "tutorial_document",
  "vectors": {
    "tutorial_document.pdf_0_abc123": {
      "id": "tutorial_document.pdf_0_abc123",
      "metadata": {
        "document_id": "12345678-1234-1234-1234-123456789abc",
        "document_title": "Tutorial Document",
        "chunk_number": 1,
        "chunk_text": "Introduction to vector databases...",
        "created_at": "2025-08-21T23:51:14.090648+00:00",
        "author": "Jane Smith",
        "category": "tutorial",
        "tags": ["beginner", "database"]
      }
    }
  },
  "count": 1,
  "fetch_metadata": true,
  "usage": {
    "list_read_units": 1,
    "fetch_read_units": 1
  }
}
```

### Empty Results Response (200)
```json
{
  "success": true,
  "namespace": "default", 
  "prefix": "nonexistent_prefix",
  "vectors": {},
  "count": 0,
  "message": "No vectors found with the specified prefix"
}
```

## cURL Examples

### Basic Prefix Search
```bash
curl -X GET "http://localhost:8000/records/search?prefix=tutorial"
```

### Search Specific Document
```bash
curl -X GET "http://localhost:8000/records/search?prefix=manual.pdf"
```

### Search dengan Limit
```bash
curl -X GET "http://localhost:8000/records/search?prefix=document&limit=10"
```

### Search IDs Only (tanpa metadata)
```bash
curl -X GET "http://localhost:8000/records/search?prefix=test&fetch_metadata=false"
```

### Search dalam Namespace Specific
```bash
curl -X GET "http://localhost:8000/records/search?prefix=report&namespace=production"
```

## Structured ID Patterns

Vector IDs menggunakan format structured: `{filename}_{chunk_index}_{hash}`

### Search by Document
```bash
# Semua chunks dari satu document
curl -X GET "http://localhost:8000/records/search?prefix=user_manual.pdf"
```

### Search by Date Pattern
```bash
# Jika filename mengandung date
curl -X GET "http://localhost:8000/records/search?prefix=2025-08-21"
```

### Search by Category
```bash
# Jika filename mengandung category
curl -X GET "http://localhost:8000/records/search?prefix=tutorial_"
```

## Use Cases

### Content Discovery
```bash
# Find all tutorial documents
curl -X GET "http://localhost:8000/records/search?prefix=tutorial" \
  | jq '.vectors[].metadata.document_title'
```

### Document Verification
```bash
# Check apakah document sudah diupload
curl -X GET "http://localhost:8000/records/search?prefix=important_document.pdf" \
  | jq '.count'
```

### Batch Content Retrieval
```bash
# Get all content dari specific document
curl -X GET "http://localhost:8000/records/search?prefix=manual.pdf" \
  | jq '.vectors[].metadata.chunk_text'
```

### Metadata Analysis
```bash
# Analyze document metadata patterns
curl -X GET "http://localhost:8000/records/search?prefix=report_2025" \
  | jq '.vectors[].metadata | {title: .document_title, author: .author, date: .created_at}'
```

## Advanced Examples

### Complex Search dengan jq Processing
```bash
# Find documents by author dalam metadata
curl -X GET "http://localhost:8000/records/search?prefix=tutorial" \
  | jq '.vectors | to_entries[] | select(.value.metadata.author == "John Doe") | .value.metadata.document_title'
```

### Count Chunks per Document
```bash
# Count berapa chunks dalam document
curl -X GET "http://localhost:8000/records/search?prefix=guide.pdf" \
  | jq '.count'
```

### Extract Unique Documents
```bash
# Get unique document titles dari search results
curl -X GET "http://localhost:8000/records/search?prefix=manual" \
  | jq '.vectors[].metadata.document_title' | sort | uniq
```

## Performance Considerations

### Fast ID-Only Search
```bash
# Lebih cepat untuk existence checking
curl -X GET "http://localhost:8000/records/search?prefix=document&fetch_metadata=false"
```

### Optimized Pagination
```bash
# Use limit untuk large result sets
curl -X GET "http://localhost:8000/records/search?prefix=log&limit=50"
```

## Response Structure

### With Metadata (default)
- Includes full vector metadata
- Higher read units usage
- Complete document information

### Without Metadata
- Only vector IDs
- Lower read units usage
- Fast existence checking

## Error Scenarios

### Empty Prefix
```bash
curl -X GET "http://localhost:8000/records/search?prefix="
# Returns: 400 "Prefix parameter is required"
```

### Invalid Namespace
```bash
curl -X GET "http://localhost:8000/records/search?prefix=test&namespace=nonexistent"
# Returns: empty results dengan success=true
```

### Large Result Sets
```bash
# Automatic limitation untuk performance
curl -X GET "http://localhost:8000/records/search?prefix=common&limit=2000"
# Returns: maximum 1000 results
```

## Related Endpoints
- `GET /records` - List all IDs dengan pagination
- `GET /records/fetch` - Get specific vectors by exact IDs
- `GET /namespaces/{namespace}/stats` - Check namespace statistics