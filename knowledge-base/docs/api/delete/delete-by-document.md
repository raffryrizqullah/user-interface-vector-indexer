# DELETE /records/by-document

Delete semua chunks dari specific document berdasarkan document_id UUID.

## Endpoint
```
DELETE /records/by-document
```

## Description
Endpoint ini menghapus semua vector chunks yang belong to satu document berdasarkan `document_id`. Sangat berguna untuk menghapus entire document beserta semua chunks-nya dalam satu operasi.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | String | ✅ | Document UUID to delete all chunks |
| `namespace` | String | ❌ | Namespace (default: "default") |
| `dry_run` | Boolean | ❌ | Preview mode without deletion (default: false) |
| `confirm` | Boolean | ❌ | Confirmation for deletion (required for actual delete) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_document_id",
  "dry_run": false,
  "message": "Successfully deleted all chunks for document '12345678-1234-1234-1234-123456789abc'",
  "document_id": "12345678-1234-1234-1234-123456789abc",
  "metadata_filter": {
    "document_id": {"$eq": "12345678-1234-1234-1234-123456789abc"}
  },
  "delete_response": "Delete completed"
}
```

### Dry Run Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_document_id",
  "dry_run": true,
  "message": "DRY RUN: Would delete all chunks for document '12345678-1234-1234-1234-123456789abc'",
  "document_id": "12345678-1234-1234-1234-123456789abc",
  "metadata_filter": {
    "document_id": {"$eq": "12345678-1234-1234-1234-123456789abc"}
  },
  "warning": "Cannot preview exact count for metadata filter without executing query"
}
```

### Error Response (400/500)
```json
{
  "detail": "Deletion requires confirmation. Set confirm=true to proceed."
}
```

## cURL Examples

### Delete Entire Document (Dry Run)
```bash
curl -X DELETE "http://localhost:8000/records/by-document?document_id=12345678-1234-1234-1234-123456789abc&dry_run=true"
```

### Delete Entire Document (Actual)
```bash
curl -X DELETE "http://localhost:8000/records/by-document?document_id=12345678-1234-1234-1234-123456789abc&confirm=true"
```

### Delete with Namespace
```bash
curl -X DELETE "http://localhost:8000/records/by-document?document_id=12345678-1234-1234-1234-123456789abc&namespace=production&confirm=true"
```

## Finding Document IDs

### From Vector IDs
```bash
# Get document_id from any chunk
VECTOR_ID="tutorial.pdf_0_abc123"
DOCUMENT_ID=$(curl -s "http://localhost:8000/records/fetch?ids=$VECTOR_ID" | \
  jq -r '.vectors[].metadata.document_id')

echo "Document ID: $DOCUMENT_ID"
```

### From Search Results
```bash
# Search for document chunks
DOCUMENT_ID=$(curl -s "http://localhost:8000/records/search?prefix=user_manual.pdf" | \
  jq -r '.vectors | to_entries[0].value.metadata.document_id')

echo "Found document ID: $DOCUMENT_ID"
```

### List All Documents
```bash
# Get unique document IDs in namespace
curl -s "http://localhost:8000/records?limit=1000" | \
  jq -r '.vector_ids[]' | \
  while read vector_id; do
    curl -s "http://localhost:8000/records/fetch?ids=$vector_id" | \
      jq -r '.vectors[].metadata | "\(.document_id) - \(.document_title)"'
  done | sort -u
```

## Use Cases

### Complete Document Removal
```bash
#!/bin/bash
# remove-document.sh

DOCUMENT_TITLE="$1"
if [ -z "$DOCUMENT_TITLE" ]; then
  echo "Usage: $0 'Document Title'"
  exit 1
fi

echo "Finding document ID for: $DOCUMENT_TITLE"

# Find document by title
DOCUMENT_ID=$(curl -s "http://localhost:8000/records?limit=100" | \
  jq -r '.vector_ids[0]' | \
  xargs -I {} curl -s "http://localhost:8000/records/fetch?ids={}" | \
  jq -r --arg title "$DOCUMENT_TITLE" \
    '.vectors[] | select(.metadata.document_title == $title) | .metadata.document_id' | \
  head -1)

if [ -z "$DOCUMENT_ID" ] || [ "$DOCUMENT_ID" = "null" ]; then
  echo "❌ Document not found: $DOCUMENT_TITLE"
  exit 1
fi

echo "📄 Found document ID: $DOCUMENT_ID"

# Preview deletion
echo "🔍 Previewing deletion..."
curl -s "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&dry_run=true" | \
  jq '.message'

# Confirm deletion
read -p "Delete entire document '$DOCUMENT_TITLE'? (y/N): " confirm
if [ "$confirm" = "y" ]; then
  curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
  echo "✅ Document deleted: $DOCUMENT_TITLE"
else
  echo "❌ Deletion cancelled"
fi
```

### Batch Document Cleanup
```bash
#!/bin/bash
# cleanup-documents.sh

# List of documents to remove
DOCUMENTS_TO_REMOVE=(
  "Old Manual v1.0"
  "Deprecated Guide"
  "Test Document"
)

for doc_title in "${DOCUMENTS_TO_REMOVE[@]}"; do
  echo "=== Processing: $doc_title ==="
  
  # Find document ID by searching chunks
  SAMPLE_VECTOR=$(curl -s "http://localhost:8000/records?limit=50" | \
    jq -r '.vector_ids[]' | \
    while read vector_id; do
      TITLE=$(curl -s "http://localhost:8000/records/fetch?ids=$vector_id" | \
        jq -r '.vectors[].metadata.document_title // empty')
      if [ "$TITLE" = "$doc_title" ]; then
        echo "$vector_id"
        break
      fi
    done)
  
  if [ -n "$SAMPLE_VECTOR" ]; then
    DOCUMENT_ID=$(curl -s "http://localhost:8000/records/fetch?ids=$SAMPLE_VECTOR" | \
      jq -r '.vectors[].metadata.document_id')
    
    echo "Found document ID: $DOCUMENT_ID"
    
    # Delete document
    curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
    echo "✅ Deleted: $doc_title"
  else
    echo "❌ Not found: $doc_title"
  fi
  echo
done
```

### Content Audit and Cleanup
```bash
# Audit documents before cleanup
echo "=== Document Audit ==="
curl -s "http://localhost:8000/records?limit=100" | \
  jq -r '.vector_ids[]' | \
  head -20 | \
  while read vector_id; do
    METADATA=$(curl -s "http://localhost:8000/records/fetch?ids=$vector_id" | \
      jq -r '.vectors[].metadata')
    
    DOCUMENT_ID=$(echo "$METADATA" | jq -r '.document_id')
    TITLE=$(echo "$METADATA" | jq -r '.document_title')
    CREATED=$(echo "$METADATA" | jq -r '.created_at')
    
    echo "$DOCUMENT_ID | $TITLE | $CREATED"
  done | sort -u

# Select document to remove
read -p "Enter document ID to delete: " DOCUMENT_ID
if [ -n "$DOCUMENT_ID" ]; then
  curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
fi
```

## Verification Examples

### Count Chunks Before/After
```bash
DOCUMENT_ID="12345678-1234-1234-1234-123456789abc"

# Count chunks before deletion
echo "Counting chunks before deletion..."
BEFORE_COUNT=$(curl -s "http://localhost:8000/records/search?prefix=document.pdf" | jq '.count')
echo "Chunks before: $BEFORE_COUNT"

# Delete document
curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"

# Count chunks after deletion
sleep 2  # Wait for Pinecone consistency
AFTER_COUNT=$(curl -s "http://localhost:8000/records/search?prefix=document.pdf" | jq '.count')
echo "Chunks after: $AFTER_COUNT"
echo "Deleted: $((BEFORE_COUNT - AFTER_COUNT)) chunks"
```

### Verify Complete Removal
```bash
DOCUMENT_ID="12345678-1234-1234-1234-123456789abc"

# Delete document
curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"

# Verify no chunks remain
sleep 2
REMAINING=$(curl -s "http://localhost:8000/records/by-filter" \
  --data-urlencode "metadata_filter={\"document_id\": {\"$eq\": \"$DOCUMENT_ID\"}}" \
  --data-urlencode "dry_run=true")

echo "Verification result:"
echo "$REMAINING" | jq '.message'
```

## Advanced Use Cases

### Conditional Document Removal
```bash
#!/bin/bash
# conditional-cleanup.sh

# Remove documents that meet certain criteria
echo "Finding documents to cleanup..."

# Get all vector IDs
ALL_VECTORS=$(curl -s "http://localhost:8000/records?limit=1000" | jq -r '.vector_ids[]')

# Track processed documents
declare -A PROCESSED_DOCS

for vector_id in $ALL_VECTORS; do
  # Get document metadata
  METADATA=$(curl -s "http://localhost:8000/records/fetch?ids=$vector_id" | \
    jq -r '.vectors[].metadata')
  
  DOCUMENT_ID=$(echo "$METADATA" | jq -r '.document_id')
  TITLE=$(echo "$METADATA" | jq -r '.document_title')
  CREATED=$(echo "$METADATA" | jq -r '.created_at')
  
  # Skip if already processed
  if [ "${PROCESSED_DOCS[$DOCUMENT_ID]}" = "1" ]; then
    continue
  fi
  
  # Mark as processed
  PROCESSED_DOCS[$DOCUMENT_ID]=1
  
  # Check if document meets removal criteria
  # Example: Remove documents older than 30 days
  CREATED_DATE=$(date -d "$CREATED" +%s 2>/dev/null || echo "0")
  CUTOFF_DATE=$(date -d "30 days ago" +%s)
  
  if [ "$CREATED_DATE" -lt "$CUTOFF_DATE" ] && [ "$CREATED_DATE" != "0" ]; then
    echo "📅 Old document found: $TITLE (Created: $CREATED)"
    
    # Dry run first
    curl -s "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&dry_run=true" | \
      jq '.message'
    
    read -p "Delete this document? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
      curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
      echo "✅ Deleted: $TITLE"
    fi
  fi
done
```

### Document Migration
```bash
#!/bin/bash
# migrate-document.sh

SOURCE_DOCUMENT_ID="$1"
TARGET_NAMESPACE="$2"

if [ -z "$SOURCE_DOCUMENT_ID" ] || [ -z "$TARGET_NAMESPACE" ]; then
  echo "Usage: $0 <document_id> <target_namespace>"
  exit 1
fi

echo "Migrating document $SOURCE_DOCUMENT_ID to namespace $TARGET_NAMESPACE"

# Note: This is a conceptual example
# In practice, you would need to:
# 1. Fetch all chunks from source
# 2. Re-upload to target namespace
# 3. Delete from source namespace

echo "⚠️  Migration requires manual re-upload to target namespace"
echo "Delete from source after confirming target upload?"

read -p "Delete from source namespace? (y/N): " confirm
if [ "$confirm" = "y" ]; then
  curl -X DELETE "http://localhost:8000/records/by-document?document_id=$SOURCE_DOCUMENT_ID&confirm=true"
  echo "✅ Deleted from source namespace"
fi
```

## Error Handling

### Invalid Document ID
```bash
# Non-existent document ID
curl -X DELETE "http://localhost:8000/records/by-document?document_id=invalid-uuid&confirm=true"
# May succeed but delete 0 vectors
```

### Missing Confirmation
```bash
# No confirmation provided
curl -X DELETE "http://localhost:8000/records/by-document?document_id=12345678-1234-1234-1234-123456789abc"
# Returns: 400 "Deletion requires confirmation. Set confirm=true to proceed."
```

### UUID Format Validation
```bash
# Validate UUID format before deletion
DOCUMENT_ID="12345678-1234-1234-1234-123456789abc"
if [[ $DOCUMENT_ID =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo "✅ Valid UUID format"
  curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
else
  echo "❌ Invalid UUID format"
fi
```

## Best Practices

### Safety Checks
1. **Always verify document ID** before deletion
2. **Use dry run first** to preview operation
3. **Confirm document title** matches expectations
4. **Check chunk count** before deletion

### Performance
- Document deletion is efficient as it uses metadata filtering
- No need to list individual chunk IDs
- Single operation removes all chunks regardless of count

### Recovery Considerations
```bash
# Before deletion, consider backing up document info
DOCUMENT_ID="12345678-1234-1234-1234-123456789abc"

# Get document metadata for backup
curl -s "http://localhost:8000/records/search?prefix=document.pdf" | \
  jq --arg doc_id "$DOCUMENT_ID" \
    '.vectors | to_entries[] | select(.value.metadata.document_id == $doc_id)' \
  > "backup_${DOCUMENT_ID}.json"

# Then proceed with deletion
curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
```

## Related Endpoints
- `GET /records/fetch` - Get document metadata including document_id
- `GET /records/search` - Find document chunks by prefix
- `DELETE /records/by-filter` - Delete using metadata filter directly
- `DELETE /records/by-prefix` - Delete by filename pattern