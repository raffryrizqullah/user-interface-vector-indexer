# GET /records

List vector IDs dari namespace dengan pagination dan filtering support.

## Endpoint
```
GET /records
```

## Description
Endpoint ini digunakan untuk mendapatkan daftar vector IDs yang tersimpan dalam namespace. Mendukung filtering berdasarkan prefix dan pagination untuk menangani dataset besar.

## Request

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `namespace` | String | "default" | Namespace yang akan di-list |
| `prefix` | String | null | Filter IDs berdasarkan prefix |
| `limit` | Integer | 100 | Maksimal results per page (1-1000) |
| `pagination_token` | String | null | Token untuk next page |
| `auto_pagination` | Boolean | false | Gunakan automatic pagination |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "prefix": null,
  "vector_ids": [
    "document1.pdf_0_abc123",
    "document1.pdf_1_def456",
    "document2.pdf_0_ghi789"
  ],
  "count": 3,
  "pagination_method": "manual",
  "pagination": {
    "current_token": null,
    "next_token": "eyJza2lwX3Bhc3Q...",
    "has_more": true
  },
  "usage": {
    "read_units": 1
  }
}
```

### Error Response (400/500)
```json
{
  "detail": "Error message"
}
```

## cURL Examples

### List All Records
```bash
curl -X GET "http://localhost:8000/records"
```

### List dengan Namespace Specific
```bash
curl -X GET "http://localhost:8000/records?namespace=production"
```

### List dengan Prefix Filter
```bash
curl -X GET "http://localhost:8000/records?prefix=tutorial_document"
```

### List dengan Pagination
```bash
curl -X GET "http://localhost:8000/records?limit=50&pagination_token=eyJza2lwX3Bhc3Q"
```

### List dengan Auto Pagination
```bash
curl -X GET "http://localhost:8000/records?auto_pagination=true&limit=10"
```

### Advanced Filter Example
```bash
curl -X GET "http://localhost:8000/records?namespace=docs&prefix=manual_&limit=25"
```

## Pagination Methods

### Manual Pagination
Memberikan kontrol penuh atas pagination dengan token:
```bash
# First page
curl -X GET "http://localhost:8000/records?limit=10"

# Next page (menggunakan next_token dari response sebelumnya)
curl -X GET "http://localhost:8000/records?limit=10&pagination_token=eyJza2lwX3Bhc3Q"
```

### Auto Pagination
Mengambil semua records dalam satu request:
```bash
curl -X GET "http://localhost:8000/records?auto_pagination=true"
```

## Use Cases

### Development & Debugging
```bash
# Check berapa banyak records yang tersimpan
curl -X GET "http://localhost:8000/records?limit=1"

# List semua IDs untuk specific document
curl -X GET "http://localhost:8000/records?prefix=tutorial.pdf"
```

### Data Management
```bash
# List records by namespace untuk cleanup
curl -X GET "http://localhost:8000/records?namespace=testing"

# Pagination untuk export besar
curl -X GET "http://localhost:8000/records?limit=1000&auto_pagination=true"
```

### Monitoring
```bash
# Quick check jumlah vectors
curl -X GET "http://localhost:8000/records?limit=1" | jq '.count'

# List recent uploads (berdasarkan naming convention)
curl -X GET "http://localhost:8000/records?prefix=2025-08"
```

## Response Fields

| Field | Description |
|-------|-------------|
| `vector_ids` | Array of vector ID strings |
| `count` | Jumlah IDs dalam response ini |
| `pagination.has_more` | Boolean apakah ada page selanjutnya |
| `pagination.next_token` | Token untuk mengambil page berikutnya |
| `usage.read_units` | Pinecone read units yang terpakai |

## Notes
- List operation hanya tersedia untuk serverless indexes
- Prefix filter case-sensitive
- Auto pagination mengambil semua records, bisa lambat untuk dataset besar
- Manual pagination lebih efisien untuk UI applications
- Read units terhitung per request, bukan per vector

## Related Endpoints
- `GET /records/fetch` - Get detail records berdasarkan IDs
- `GET /records/search` - Search by prefix dengan metadata
- `GET /namespaces/{namespace}/stats` - Get namespace statistics