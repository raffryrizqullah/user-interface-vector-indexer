# POST /create-index

Membuat Pinecone vector index baru untuk menyimpan vector embeddings.

## Endpoint
```
POST /create-index
```

## Description
Endpoint ini digunakan untuk membuat index baru di Pinecone. Index adalah tempat penyimpanan utama untuk vector embeddings dan metadata. Setiap project membutuhkan minimal satu index untuk menyimpan data vectors.

## Request

### Headers
```
Content-Type: application/json
```

### Body
Tidak ada body yang diperlukan.

## Response

### Success Response (200)
```json
{
  "success": true,
  "message": "Index created successfully"
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Failed to create index: [error details]"
}
```

## cURL Example

### Basic Request
```bash
curl -X POST "http://localhost:8000/create-index" \
  -H "Content-Type: application/json"
```

### Example Response
```bash
# Success
{
  "success": true,
  "message": "Index 'standard-dense-py' created successfully with dimension 3072"
}

# Error (Index already exists)
{
  "success": false,
  "message": "Index already exists: standard-dense-py"
}
```

## Notes
- Index akan dibuat dengan konfigurasi yang sudah diset di environment variables
- Dimensi vector default adalah 3072 (untuk OpenAI text-embedding-3-large)
- Index type: serverless dengan cloud provider GCP
- Metric: cosine similarity
- Jika index sudah ada, akan return error message

## Environment Variables Required
```env
PINECONE_API_KEY=your_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_VECTOR_DIM=3072
PINECONE_CLOUD=gcp
PINECONE_REGION=europe-west4
```

## Use Cases
- Initial setup project baru
- Membuat index untuk environment testing
- Recovery ketika index terhapus

## Related Endpoints
- `GET /health/pinecone` - Check index status
- `POST /create-records` - Upload data ke index