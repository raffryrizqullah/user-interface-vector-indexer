# DELETE /records/by-ids

Delete specific vector records berdasarkan ID list dengan dry-run safety support.

## Endpoint
```
DELETE /records/by-ids
```

## Description
Endpoint ini menghapus vector records yang spesifik berdasarkan daftar IDs. Mendukung dry-run mode untuk preview sebelum deletion dan memerlukan konfirmasi eksplisit untuk actual deletion.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | String | ✅ | Comma-separated list of vector IDs to delete |
| `namespace` | String | ❌ | Namespace (default: "default") |
| `dry_run` | Boolean | ❌ | Preview mode without deletion (default: false) |
| `confirm` | Boolean | ❌ | Confirmation for deletion (required for actual delete) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_ids",
  "dry_run": false,
  "message": "Successfully deleted 2 vectors from namespace 'default'",
  "requested_ids": [
    "document.pdf_0_abc123",
    "document.pdf_1_def456"
  ],
  "requested_count": 2,
  "delete_response": "Delete completed"
}
```

### Dry Run Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_ids",
  "dry_run": true,
  "message": "DRY RUN: Would delete 2 vectors, skip 0 missing vectors",
  "requested_ids": [
    "document.pdf_0_abc123",
    "document.pdf_1_def456"
  ],
  "existing_ids": [
    "document.pdf_0_abc123",
    "document.pdf_1_def456"
  ],
  "missing_ids": [],
  "would_delete_count": 2,
  "would_skip_count": 0
}
```

### Error Response (400/500)
```json
{
  "detail": "Deletion requires confirmation. Set confirm=true to proceed."
}
```

## cURL Examples

### Dry Run Preview
```bash
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc1_0_abc123,doc1_1_def456&dry_run=true"
```

### Actual Deletion
```bash
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc1_0_abc123,doc1_1_def456&confirm=true"
```

### Delete Single Vector
```bash
curl -X DELETE "http://localhost:8000/records/by-ids?ids=document.pdf_0_abc123&confirm=true"
```

### Delete with Namespace
```bash
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc1_0_abc123&namespace=production&confirm=true"
```

### Multiple IDs Deletion
```bash
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc1_0_abc,doc1_1_def,doc2_0_ghi,doc2_1_jkl&confirm=true"
```

## Safety Features

### Dry Run Mode
```bash
# Always test with dry run first
curl -X DELETE "http://localhost:8000/records/by-ids?ids=important_doc_0_abc123&dry_run=true"

# Review the output, then proceed with actual deletion
curl -X DELETE "http://localhost:8000/records/by-ids?ids=important_doc_0_abc123&confirm=true"
```

### Confirmation Required
```bash
# This will fail - no confirmation
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc_0_abc123"
# Returns: "Deletion requires confirmation. Set confirm=true to proceed."

# This will succeed
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc_0_abc123&confirm=true"
```

## Use Cases

### Cleanup Specific Documents
```bash
# Get document chunks first
CHUNKS=$(curl -s "http://localhost:8000/records/search?prefix=old_document.pdf" | jq -r '.vectors | keys | join(",")')

# Preview deletion
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$CHUNKS&dry_run=true"

# Execute deletion
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$CHUNKS&confirm=true"
```

### Remove Failed Uploads
```bash
# List recent vectors
RECENT_IDS=$(curl -s "http://localhost:8000/records?limit=10" | jq -r '.vector_ids[0:3] | join(",")')

# Delete failed upload chunks
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$RECENT_IDS&confirm=true"
```

### Selective Content Removal
```bash
# Remove specific chunks dari document
curl -X DELETE "http://localhost:8000/records/by-ids?ids=manual.pdf_5_abc123,manual.pdf_6_def456&confirm=true"
```

## Batch Processing

### Large ID Lists
```bash
# Split large deletions into smaller batches
IDS_BATCH_1="doc1_0_a,doc1_1_b,doc1_2_c,doc1_3_d,doc1_4_e"
IDS_BATCH_2="doc1_5_f,doc1_6_g,doc1_7_h,doc1_8_i,doc1_9_j"

# Process each batch
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$IDS_BATCH_1&confirm=true"
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$IDS_BATCH_2&confirm=true"
```

### Automated Cleanup Script
```bash
#!/bin/bash
# cleanup-old-vectors.sh

NAMESPACE=${1:-default}
echo "Cleaning up old vectors in namespace: $NAMESPACE"

# Get vectors older than 30 days (example based on naming convention)
OLD_VECTORS=$(curl -s "http://localhost:8000/records?namespace=$NAMESPACE" | \
  jq -r '.vector_ids[] | select(contains("2024-07"))' | \
  head -50 | paste -sd,)

if [ -n "$OLD_VECTORS" ]; then
  echo "Found old vectors: $OLD_VECTORS"
  
  # Dry run first
  echo "Previewing deletion..."
  curl -s "http://localhost:8000/records/by-ids?ids=$OLD_VECTORS&namespace=$NAMESPACE&dry_run=true" | \
    jq '.would_delete_count'
  
  # Confirm deletion
  read -p "Proceed with deletion? (y/N): " confirm
  if [ "$confirm" = "y" ]; then
    curl -X DELETE "http://localhost:8000/records/by-ids?ids=$OLD_VECTORS&namespace=$NAMESPACE&confirm=true"
    echo "Deletion completed"
  else
    echo "Deletion cancelled"
  fi
else
  echo "No old vectors found"
fi
```

## Error Handling

### Missing IDs
```bash
# Some IDs don't exist
curl -X DELETE "http://localhost:8000/records/by-ids?ids=existing_id,missing_id&dry_run=true"

# Response shows which IDs would be skipped
{
  "existing_ids": ["existing_id"],
  "missing_ids": ["missing_id"],
  "would_delete_count": 1,
  "would_skip_count": 1
}
```

### Invalid IDs Format
```bash
# Empty IDs list
curl -X DELETE "http://localhost:8000/records/by-ids?ids=&confirm=true"
# Returns: 400 "No valid vector IDs provided"

# Too many IDs (>1000)
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$(seq 1 1001 | paste -sd,)&confirm=true"
# Returns: 400 "Maximum 1000 IDs allowed per request"
```

### Network Issues
```bash
# Handle connection timeouts
timeout 30 curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc_0_abc&confirm=true" || \
  echo "Deletion request timed out"
```

## Validation Rules
- Maximum 1000 IDs per request
- IDs must be non-empty strings
- Confirmation required for actual deletion (`confirm=true`)
- Dry run mode available for safety preview
- Missing IDs are logged but don't cause failure

## Response Fields

| Field | Description |
|-------|-------------|
| `requested_ids` | List of IDs that were requested for deletion |
| `requested_count` | Total number of IDs requested |
| `existing_ids` | IDs that exist (dry run only) |
| `missing_ids` | IDs that don't exist (dry run only) |
| `would_delete_count` | Count of vectors that would be deleted (dry run) |
| `delete_response` | Pinecone API response (actual deletion) |

## Best Practices

### Safety First
1. **Always use dry run first**: Preview before actual deletion
2. **Verify IDs**: Check that you're deleting the right vectors
3. **Batch operations**: Don't delete too many at once
4. **Backup consideration**: Understand that deletion is permanent

### Performance
```bash
# Good: Reasonable batch size
curl -X DELETE "http://localhost:8000/records/by-ids?ids=id1,id2,id3,id4,id5&confirm=true"

# Avoid: Too many IDs in single request
curl -X DELETE "http://localhost:8000/records/by-ids?ids=$(generate_1000_ids)&confirm=true"
```

### Error Recovery
```bash
# Check remaining vectors after deletion
curl -X DELETE "http://localhost:8000/records/by-ids?ids=doc_0_abc&confirm=true"
curl "http://localhost:8000/records/search?prefix=doc" | jq '.count'
```

## Related Endpoints
- `GET /records` - List available vector IDs
- `GET /records/fetch` - Get vector details before deletion
- `DELETE /records/by-prefix` - Delete by pattern matching
- `GET /records/deletion-preview` - Preview multiple deletion methods