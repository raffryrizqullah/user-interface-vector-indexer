# POST /create-records

Upload PDF files dan convert menjadi vector records di Pinecone dengan metadata lengkap.

## Endpoint
```
POST /create-records
```

## Description
Endpoint ini melakukan full pipeline processing:
1. Upload multiple PDF files
2. Extract dan clean text content
3. Chunking text menjadi segments
4. Generate embeddings menggunakan OpenAI
5. Upsert vector records ke Pinecone dengan metadata

## Request

### Headers
```
Content-Type: multipart/form-data
```

### Form Data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | ✅ | Array of PDF files to upload |
| `source_links` | String | ✅ | JSON array of source URLs untuk setiap file |
| `custom_metadata` | String | ❌ | JSON object dengan metadata tambahan |

## Response

### Success Response (200)
```json
{
  "success": true,
  "message": "Processed 2 files, 2 successful",
  "results": [
    {
      "original_filename": "document.pdf",
      "clean_filename": "document.pdf",
      "document_uuid": "12345678-1234-1234-1234-123456789abc",
      "content_chunks": ["chunk1 text...", "chunk2 text..."],
      "total_chunks": 2,
      "source_link": "https://example.com/document.pdf",
      "file_size": 256000,
      "status": "success",
      "embeddings_successful": 2,
      "records_upserted": 2,
      "upsert_successful": true
    }
  ],
  "total_files_processed": 2
}
```

### Error Response (400/500)
```json
{
  "detail": "Error message details"
}
```

## cURL Examples

### Basic Upload
```bash
curl -X POST "http://localhost:8000/create-records" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf" \
  -F 'source_links=["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"]' \
  -F 'custom_metadata={}'
```

### Upload dengan Custom Metadata
```bash
curl -X POST "http://localhost:8000/create-records" \
  -F "files=@tutorial.pdf" \
  -F 'source_links=["https://docs.example.com/tutorial.pdf"]' \
  -F 'custom_metadata={
    "author": "John Doe",
    "category": "tutorial", 
    "tags": ["beginner", "guide"],
    "is_public": true,
    "version": "1.0"
  }'
```

### Multiple Files dengan Metadata
```bash
curl -X POST "http://localhost:8000/create-records" \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf" \
  -F "files=@doc3.pdf" \
  -F 'source_links=[
    "https://example.com/doc1.pdf",
    "https://example.com/doc2.pdf", 
    "https://example.com/doc3.pdf"
  ]' \
  -F 'custom_metadata={
    "project": "knowledge-base",
    "department": "engineering",
    "confidential": false
  }'
```

## Metadata Structure

### Required Metadata (Auto-generated)
```json
{
  "document_id": "uuid4-string",
  "document_title": "Formatted Document Title", 
  "chunk_number": 1,
  "chunk_text": "actual chunk content...",
  "created_at": "2025-08-21T23:51:14.090648+00:00"
}
```

### Optional Custom Metadata
Semua custom metadata akan di-merge dengan required metadata. Supported types:
- `string` - Text values
- `number` - Numeric values  
- `boolean` - True/false values
- `list of strings` - Array of text values

## Validation Rules
- Maximum file size: 50MB per file
- Supported format: PDF only
- Source links array harus sama atau lebih banyak dari jumlah files
- Custom metadata harus valid JSON object
- Reserved field names tidak bisa digunakan dalam custom metadata

## Processing Pipeline
1. **PDF Extraction** - Extract text dari PDF files
2. **Text Cleaning** - Clean dan normalize text content
3. **Chunking** - Split text menjadi optimal chunks
4. **Embeddings** - Generate vectors menggunakan OpenAI text-embedding-3-large
5. **Upsert** - Store vectors + metadata ke Pinecone dengan batch processing

## Error Handling
- Invalid file format → 400 Bad Request
- Missing source links → 400 Bad Request  
- PDF processing error → Partial success dengan error details
- Embedding generation error → Retry dengan exponential backoff
- Pinecone upsert error → Detailed error information

## Related Endpoints
- `POST /create-index` - Create index terlebih dahulu
- `GET /records` - List uploaded records
- `GET /records/fetch` - Get specific records