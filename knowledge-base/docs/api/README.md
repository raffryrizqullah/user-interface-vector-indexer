# Vector Indexer API Documentation

Comprehensive REST API untuk PDF processing, vector embeddings, dan Pinecone vector database operations.

## 🚀 Quick Start

### Base URL
```
http://localhost:8000
```

### Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

## 📋 API Overview

Vector Indexer API menyediakan complete pipeline untuk:
- ✅ **PDF Processing** - Upload dan extract text dari PDF files
- ✅ **Text Embeddings** - Generate vectors menggunakan OpenAI
- ✅ **Vector Storage** - Store dan manage vectors di Pinecone
- ✅ **Data Retrieval** - Search dan fetch vector data dengan metadata
- ✅ **Data Deletion** - Safe deletion operations dengan dry-run support

## 🛠️ Operations

### AUTHENTICATION Operations
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/login` | POST | User authentication | ❌ |
| `/auth/logout` | POST | Logout and invalidate tokens | ✅ User |
| `/auth/register` | POST | Create new user | ✅ Super Admin |
| `/auth/refresh` | POST | Refresh access token | ❌ |
| `/auth/me` | GET | Get current user profile | ✅ User |
| `/auth/change-password` | POST | Change user password | ✅ User |

### USER MANAGEMENT Operations  
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/users/` | GET | List users with filtering | ✅ Admin |
| `/users/{id}` | GET | Get user details | ✅ Admin |
| `/users/{id}` | PUT | Update user | ✅ Admin |
| `/users/{id}` | DELETE | Delete user | ✅ Super Admin |
| `/users/{id}/sessions` | GET | Get user sessions | ✅ Admin |

### CREATE Operations
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/create-index` | POST | Create Pinecone vector index | ✅ Admin |
| `/create-records` | POST | Upload PDFs dan create vector records | ✅ Admin |

### READ Operations  
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/records` | GET | List vector IDs dengan pagination | ✅ Admin |
| `/records/fetch` | GET | Fetch specific vectors by IDs | ✅ Admin |
| `/records/search` | GET | Search vectors by prefix pattern | ✅ Admin |
| `/namespaces/{namespace}/stats` | GET | Get namespace statistics | ✅ Admin |

### DELETE Operations
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/records/by-ids` | DELETE | Delete specific vectors by IDs | ✅ Admin |
| `/records/by-filter` | DELETE | Delete vectors by metadata filter | ✅ Admin |
| `/records/by-document` | DELETE | Delete entire document by UUID | ✅ Admin |
| `/records/by-prefix` | DELETE | Delete vectors by prefix pattern | ✅ Admin |
| `/namespaces/{namespace}` | DELETE | Delete all vectors in namespace | ✅ Admin |
| `/records/deletion-preview` | GET | Preview deletion operations | ✅ Admin |

### HEALTH Operations
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Basic service health check | ❌ |
| `/health/pinecone` | GET | Comprehensive Pinecone health check | ❌ |

## 📖 Detailed Documentation

### AUTHENTICATION Operations
- **[Login](auth/login.md)** - User authentication and token generation
- **[Register](auth/register.md)** - Create new user (Super Admin only)
- **[Logout](auth/logout.md)** - Invalidate user session and tokens
- **[Refresh Token](auth/refresh.md)** - Get new access token using refresh token
- **[User Profile](auth/me.md)** - Get current user profile information
- **[Change Password](auth/change-password.md)** - Update user password

### USER MANAGEMENT Operations
- **[List Users](users/list-users.md)** - Get paginated list of users with filtering
- **[Get User](users/get-user.md)** - Get specific user details by ID
- **[Update User](users/update-user.md)** - Update user information and roles
- **[Delete User](users/delete-user.md)** - Remove user account (Super Admin only)
- **[User Sessions](users/user-sessions.md)** - View active user sessions

### CREATE Operations
- **[Create Index](create/create-index.md)** - Setup Pinecone vector index
- **[Create Records](create/create-records.md)** - Upload PDF dan generate vectors

### READ Operations
- **[List Records](read/list-records.md)** - Browse vector IDs dengan pagination
- **[Fetch Records](read/fetch-records.md)** - Get detail vectors by specific IDs
- **[Search Records](read/search-records.md)** - Search by prefix dengan metadata
- **[Namespace Stats](read/namespace-stats.md)** - Get namespace information

### DELETE Operations
- **[Delete by IDs](delete/delete-by-ids.md)** - Delete specific vectors by IDs
- **[Delete by Filter](delete/delete-by-filter.md)** - Delete vectors by metadata criteria
- **[Delete by Document](delete/delete-by-document.md)** - Delete entire document by UUID
- **[Delete by Prefix](delete/delete-by-prefix.md)** - Delete vectors by prefix pattern
- **[Delete Namespace](delete/delete-namespace.md)** - Delete all vectors in namespace
- **[Deletion Preview](delete/deletion-preview.md)** - Preview deletion operations

### HEALTH Operations
- **[Basic Health](health/basic-health.md)** - Simple service status check
- **[Pinecone Health](health/pinecone-health.md)** - Deep system health check

## 🔧 Common Use Cases

### 1. Authentication & Initial Setup
```bash
# Create database tables (first time only)
python create_tables.py

# Create super admin user (first time only)
python create_admin_user.py

# Login to get access token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"your-password"}'

# Create vector index (requires admin token)
curl -X POST "http://localhost:8000/create-index" \
  -H "Authorization: Bearer <your-access-token>"

# Verify setup
curl -X GET "http://localhost:8000/health/pinecone"
```

### 2. Upload Documents (Authenticated)
```bash
# Upload single PDF (requires admin token)
curl -X POST "http://localhost:8000/create-records" \
  -H "Authorization: Bearer <your-access-token>" \
  -F "files=@document.pdf" \
  -F 'source_links=["https://example.com/document.pdf"]' \
  -F 'custom_metadata={}'
```

### 3. Browse Data (Authenticated)
```bash
# List all vectors (requires admin token)
curl -H "Authorization: Bearer <your-access-token>" \
  "http://localhost:8000/records"

# Search specific document (requires admin token)
curl -H "Authorization: Bearer <your-access-token>" \
  "http://localhost:8000/records/search?prefix=document.pdf"
```

### 4. Get Document Details (Authenticated)
```bash
# Get specific vector details (requires admin token)
curl -H "Authorization: Bearer <your-access-token>" \
  "http://localhost:8000/records/fetch?ids=document.pdf_0_abc123"
```

### 5. Delete Data with Safety (Authenticated)
```bash
# Preview deletion first (requires admin token)
curl -H "Authorization: Bearer <your-access-token>" \
  -X DELETE "http://localhost:8000/records/by-document?document_id=uuid&dry_run=true"

# Execute deletion with confirmation (requires admin token)
curl -H "Authorization: Bearer <your-access-token>" \
  -X DELETE "http://localhost:8000/records/by-document?document_id=uuid&confirm=true"
```

### 6. User Management (Super Admin Only)
```bash
# Create new admin user (requires super admin token)
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super-admin-token>" \
  -d '{"username":"newadmin","email":"admin@company.com","password":"SecurePass123!","role":"admin"}'

# List all users (requires admin token)
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:8000/users/"

# Update user role (requires super admin token for role changes)
curl -X PUT "http://localhost:8000/users/user-uuid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super-admin-token>" \
  -d '{"role":"super_admin"}'
```

## 🔗 Workflow Examples

### Complete PDF Processing Workflow
```bash
#!/bin/bash
# complete-workflow.sh

echo "1. Checking system health..."
curl -s "http://localhost:8000/health/pinecone" | jq '.success'

echo "2. Uploading PDF..."
RESPONSE=$(curl -s -X POST "http://localhost:8000/create-records" \
  -F "files=@tutorial.pdf" \
  -F 'source_links=["https://docs.example.com/tutorial.pdf"]' \
  -F 'custom_metadata={"author": "John Doe", "category": "tutorial"}')

echo "3. Checking upload results..."
echo $RESPONSE | jq '.total_files_processed, .results[0].records_upserted'

echo "4. Listing uploaded records..."
curl -s "http://localhost:8000/records/search?prefix=tutorial.pdf" | jq '.count'

echo "5. Getting document metadata..."
FIRST_ID=$(curl -s "http://localhost:8000/records/search?prefix=tutorial.pdf" | jq -r '.vectors | keys[0]')
curl -s "http://localhost:8000/records/fetch?ids=$FIRST_ID" | jq '.vectors[].metadata.document_title'

echo "6. Testing deletion preview..."
DOCUMENT_ID=$(curl -s "http://localhost:8000/records/fetch?ids=$FIRST_ID" | jq -r '.vectors[].metadata.document_id')
curl -s "http://localhost:8000/records/deletion-preview?document_id=$DOCUMENT_ID" | jq '.preview_results[0].result.message'
```

### Monitoring Script
```bash
#!/bin/bash
# monitor-system.sh

echo "=== Vector Indexer System Status ==="
echo "Service: $(curl -s http://localhost:8000/health | jq -r '.status')"
echo "Pinecone: $(curl -s http://localhost:8000/health/pinecone | jq -r 'if .success then "Connected" else "Failed" end')"

echo -e "\n=== Namespace Statistics ==="
for ns in default production testing; do
  STATS=$(curl -s "http://localhost:8000/namespaces/$ns/stats")
  EXISTS=$(echo $STATS | jq '.namespace_exists')
  COUNT=$(echo $STATS | jq '.stats.vector_count')
  printf "%-12s %s %6d vectors\n" "$ns:" "$([ "$EXISTS" = "true" ] && echo "✅" || echo "❌")" "$COUNT"
done
```

## 📊 Response Formats

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Standard Error Response  
```json
{
  "detail": "Error description with specific details"
}
```

### Pagination Response
```json
{
  "vector_ids": ["id1", "id2", "id3"],
  "count": 3,
  "pagination": {
    "next_token": "eyJza2lwX3Bhc3Q...",
    "has_more": true
  }
}
```

## 🔐 Authentication & Configuration

### Environment Variables
```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_VECTOR_DIM=3072
PINECONE_CLOUD=gcp
PINECONE_REGION=europe-west4
PINECONE_NAMESPACE=default

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

### Configuration Check
```bash
# Verify all configurations
curl -s "http://localhost:8000/health/pinecone" | jq '{
  index: .index_name,
  dimension: .config.dimension,
  namespace: .config.namespace
}'
```

## 📝 Data Models

### Vector Metadata Structure
```json
{
  // Required fields (auto-generated)
  "document_id": "uuid4-string",
  "document_title": "Formatted Document Title",
  "chunk_number": 1,
  "chunk_text": "actual chunk content...",
  "created_at": "2025-08-21T23:51:14.090648+00:00",
  
  // Custom fields (optional)
  "author": "John Doe",
  "category": "tutorial",
  "tags": ["guide", "beginner"],
  "is_public": true
}
```

### Vector ID Format
```
{filename}_{chunk_index}_{hash}
```
Example: `tutorial_document.pdf_0_abc123`

## ⚡ Performance Tips

### Optimal Batch Sizes
- **Upload**: 5-10 files per request
- **Fetch**: Up to 100 IDs per request  
- **List**: 100-500 results per page

### Efficient Querying
```bash
# Use prefix search untuk document-specific queries
curl "http://localhost:8000/records/search?prefix=document.pdf"

# Use fetch untuk specific IDs
curl "http://localhost:8000/records/fetch?ids=id1,id2,id3"

# Use list untuk pagination
curl "http://localhost:8000/records?limit=100&pagination_token=..."

# Use dry-run untuk safe deletion
curl "http://localhost:8000/records/by-prefix?prefix=test_&dry_run=true"
```

## 🚨 Error Handling

### Common HTTP Status Codes
- **200 OK** - Success
- **400 Bad Request** - Invalid parameters atau data
- **500 Internal Server Error** - Server atau external service error

### Retry Logic
```bash
# Implement exponential backoff untuk production
retry_request() {
  local url=$1
  local max_retries=3
  local delay=1
  
  for i in $(seq 1 $max_retries); do
    if curl -s "$url" >/dev/null; then
      return 0
    fi
    echo "Retry $i/$max_retries failed, waiting ${delay}s..."
    sleep $delay
    delay=$((delay * 2))
  done
  return 1
}
```

## 🔍 Debugging & Troubleshooting

### Debug Checklist
1. **Service Status**: `GET /health`
2. **Pinecone Connection**: `GET /health/pinecone`  
3. **Data Availability**: `GET /records?limit=1`
4. **Configuration**: Check environment variables
5. **Deletion Safety**: `GET /records/deletion-preview` before actual deletion

### Common Issues
- **Empty results**: Check namespace dan index name
- **Authentication errors**: Verify API keys
- **Timeout**: Check network connectivity
- **Rate limits**: Implement proper backoff

## 📚 Additional Resources

### API Testing
- Use **Postman** collection (available in `/docs/postman/`)
- Use **curl** commands dari dokumentasi
- Use **FastAPI docs** di `http://localhost:8000/docs`

### Integration Examples
- **Python SDK** examples di `/examples/python/`
- **JavaScript/Node.js** examples di `/examples/javascript/`
- **Shell scripts** examples di `/examples/bash/`

---

**Need help?** Check individual endpoint documentation untuk detailed examples dan use cases.