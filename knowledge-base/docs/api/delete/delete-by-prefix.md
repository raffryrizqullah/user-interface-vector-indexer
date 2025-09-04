# DELETE /records/by-prefix

Delete vectors berdasarkan ID prefix pattern dengan batch processing dan safety checks.

## Endpoint
```
DELETE /records/by-prefix
```

## Description
Endpoint ini menghapus vectors berdasarkan ID prefix pattern. Menggunakan list + delete strategy untuk structured ID deletion dengan batch processing untuk performance yang optimal.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prefix` | String | ✅ | ID prefix pattern untuk delete |
| `namespace` | String | ❌ | Namespace (default: "default") |
| `dry_run` | Boolean | ❌ | Preview mode without deletion (default: false) |
| `confirm` | Boolean | ❌ | Confirmation for deletion (required for actual delete) |
| `batch_size` | Integer | ❌ | Batch size for deletion (default: 100) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_prefix",
  "dry_run": false,
  "prefix": "document.pdf",
  "found_count": 25,
  "deleted_count": 25,
  "failed_batches": 0,
  "batch_size": 100,
  "total_batches": 1,
  "message": "Deleted 25/25 vectors with prefix 'document.pdf'"
}
```

### Dry Run Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_prefix",
  "dry_run": true,
  "prefix": "document.pdf",
  "found_ids": [
    "document.pdf_0_abc123",
    "document.pdf_1_def456",
    "document.pdf_2_ghi789"
  ],
  "found_count": 3,
  "deleted_count": 0,
  "failed_batches": 0,
  "batch_size": 100,
  "total_batches": 1,
  "message": "DRY RUN: Would delete 3 vectors with prefix 'document.pdf'"
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
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=document.pdf&dry_run=true"
```

### Delete by Document Prefix
```bash
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=document.pdf&confirm=true"
```

### Delete with Custom Batch Size
```bash
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=large_doc&batch_size=50&confirm=true"
```

### Delete in Specific Namespace
```bash
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=temp_&namespace=testing&confirm=true"
```

## Use Cases

### Document Cleanup
```bash
# Remove all chunks from specific document
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=user_manual.pdf&confirm=true"
```

### Development Cleanup
```bash
# Remove test data with prefix
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=test_&dry_run=true"

# After review, execute
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=test_&confirm=true"
```

### Batch Document Removal
```bash
# Remove multiple documents dengan same pattern
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=2024-01&confirm=true"
```

### Failed Upload Cleanup
```bash
# Remove incomplete uploads
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=incomplete_&confirm=true"
```

## Advanced Examples

### Large Dataset Cleanup
```bash
#!/bin/bash
# cleanup-large-dataset.sh

PREFIX="$1"
NAMESPACE="${2:-default}"
BATCH_SIZE="${3:-50}"

if [ -z "$PREFIX" ]; then
  echo "Usage: $0 <prefix> [namespace] [batch_size]"
  exit 1
fi

echo "=== Large Dataset Cleanup ==="
echo "Prefix: $PREFIX"
echo "Namespace: $NAMESPACE"
echo "Batch size: $BATCH_SIZE"

# Preview deletion
echo "Previewing deletion..."
PREVIEW=$(curl -s "http://localhost:8000/records/by-prefix?prefix=$PREFIX&namespace=$NAMESPACE&dry_run=true")
FOUND_COUNT=$(echo "$PREVIEW" | jq -r '.found_count')

echo "Found $FOUND_COUNT vectors to delete"

if [ "$FOUND_COUNT" -gt 0 ]; then
  read -p "Proceed with deletion? (y/N): " confirm
  if [ "$confirm" = "y" ]; then
    # Execute with custom batch size
    curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=$PREFIX&namespace=$NAMESPACE&batch_size=$BATCH_SIZE&confirm=true"
    echo "✅ Cleanup completed"
  else
    echo "❌ Cleanup cancelled"
  fi
else
  echo "No vectors found with prefix '$PREFIX'"
fi
```

### Pattern-based Content Management
```bash
#!/bin/bash
# pattern-cleanup.sh

# Cleanup patterns for different content types
PATTERNS=(
  "draft_"
  "temp_"
  "test_"
  "backup_"
  "old_"
)

for pattern in "${PATTERNS[@]}"; do
  echo "=== Processing pattern: $pattern ==="
  
  # Check if pattern exists
  RESULT=$(curl -s "http://localhost:8000/records/by-prefix?prefix=$pattern&dry_run=true")
  COUNT=$(echo "$RESULT" | jq -r '.found_count')
  
  if [ "$COUNT" -gt 0 ]; then
    echo "Found $COUNT vectors with pattern '$pattern'"
    
    read -p "Delete pattern '$pattern'? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
      curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=$pattern&confirm=true"
      echo "✅ Deleted pattern: $pattern"
    else
      echo "⏭️  Skipped pattern: $pattern"
    fi
  else
    echo "No vectors found for pattern: $pattern"
  fi
  echo
done
```

### Time-based Cleanup
```bash
#!/bin/bash
# time-based-cleanup.sh

# Remove old documents based on date prefix
OLD_DATES=(
  "2024-01"
  "2024-02"
  "2024-03"
)

for date_prefix in "${OLD_DATES[@]}"; do
  echo "=== Cleaning up date: $date_prefix ==="
  
  # Find documents from this time period
  PREVIEW=$(curl -s "http://localhost:8000/records/by-prefix?prefix=$date_prefix&dry_run=true")
  COUNT=$(echo "$PREVIEW" | jq -r '.found_count')
  
  if [ "$COUNT" -gt 0 ]; then
    echo "📅 Found $COUNT vectors from $date_prefix"
    
    # Show sample IDs
    echo "Sample IDs:"
    echo "$PREVIEW" | jq -r '.found_ids[:3][] // empty'
    
    read -p "Delete all vectors from $date_prefix? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
      curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=$date_prefix&confirm=true"
      echo "✅ Deleted: $date_prefix"
    fi
  else
    echo "No vectors found for: $date_prefix"
  fi
  echo
done
```

## Prefix Patterns

### Document-based Patterns
```bash
# By document name
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=user_guide.pdf&confirm=true"

# By document type
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=manual_&confirm=true"

# By version
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=v1.0_&confirm=true"
```

### Date-based Patterns
```bash
# By year
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=2023&confirm=true"

# By month
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=2024-06&confirm=true"

# By specific date
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=2024-06-15&confirm=true"
```

### Category-based Patterns
```bash
# By status
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=draft_&confirm=true"

# By environment
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=test_&namespace=development&confirm=true"

# By source
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=upload_&confirm=true"
```

## Batch Processing

### Understanding Batch Sizes
```bash
# Small batch for testing
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=test_&batch_size=10&confirm=true"

# Medium batch for regular use
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=document_&batch_size=50&confirm=true"

# Large batch for bulk operations
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=old_&batch_size=100&confirm=true"
```

### Monitoring Batch Progress
```bash
# Get deletion result with batch details
RESULT=$(curl -s -X DELETE "http://localhost:8000/records/by-prefix?prefix=large_doc&batch_size=25&confirm=true")

echo "Batch processing results:"
echo "$RESULT" | jq '{
  found_count,
  deleted_count,
  failed_batches,
  total_batches,
  batch_size,
  success
}'
```

## Error Handling

### No Vectors Found
```bash
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=nonexistent&confirm=true"
# Returns: "No vectors found with prefix 'nonexistent'"
```

### Missing Confirmation
```bash
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=document.pdf"
# Returns: 400 "Deletion requires confirmation. Set confirm=true to proceed."
```

### Batch Failures
```bash
# If some batches fail, response shows partial success
{
  "success": false,
  "deleted_count": 75,
  "found_count": 100,
  "failed_batches": 1,
  "warning": "1 batches failed during deletion"
}
```

### Connection Issues
```bash
# Handle timeouts gracefully
timeout 60 curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=large_dataset&confirm=true" || \
  echo "Operation timed out - check server status"
```

## Performance Considerations

### Optimal Batch Sizes
- **Small datasets (<100 vectors)**: Use default batch_size=100
- **Medium datasets (100-1000 vectors)**: Use batch_size=50
- **Large datasets (>1000 vectors)**: Use batch_size=25

### Monitoring Performance
```bash
# Time the operation
time curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=large_doc&batch_size=50&confirm=true"
```

### Memory Considerations
```bash
# For very large prefixes, consider smaller batches
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=massive_dataset&batch_size=10&confirm=true"
```

## Safety Features

### Dry Run First
```bash
# Always preview before deletion
echo "=== Preview ==="
curl -s "http://localhost:8000/records/by-prefix?prefix=important_&dry_run=true" | jq '.message'

echo "=== Execute ==="
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=important_&confirm=true"
```

### Confirmation Required
- All actual deletions require `confirm=true`
- Dry run mode available for safety preview
- Batch failures don't stop entire operation

### Backup Considerations
```bash
# Export before deletion
curl "http://localhost:8000/records/search?prefix=document_to_delete" > backup.json

# Then delete
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=document_to_delete&confirm=true"
```

## Validation Rules
- Prefix must be non-empty string
- Maximum batch_size is 1000
- Confirmation required for actual deletion (`confirm=true`)
- Dry run mode available for safety preview
- Failed batches are logged but don't cause total failure

## Response Fields

| Field | Description |
|-------|-------------|
| `prefix` | The prefix pattern used for deletion |
| `found_count` | Total number of vectors found with prefix |
| `deleted_count` | Number of vectors successfully deleted |
| `failed_batches` | Number of batches that failed |
| `batch_size` | Batch size used for processing |
| `total_batches` | Total number of batches processed |
| `found_ids` | List of vector IDs found (dry run only) |

## Best Practices

### Safety First
1. **Always use dry run first**: Preview before actual deletion
2. **Verify prefix pattern**: Make sure you're targeting the right vectors
3. **Use appropriate batch sizes**: Don't overwhelm the system
4. **Monitor batch failures**: Check for partial failures

### Performance Optimization
```bash
# Good: Reasonable batch size
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=doc&batch_size=50&confirm=true"

# Avoid: Too large batch size
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=doc&batch_size=1000&confirm=true"
```

### Pattern Specificity
```bash
# Good: Specific pattern
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=temp_2024_06&confirm=true"

# Risky: Too broad pattern
curl -X DELETE "http://localhost:8000/records/by-prefix?prefix=a&confirm=true"
```

## Related Endpoints
- `GET /records` - List vectors to find prefixes
- `DELETE /records/by-document` - Delete entire documents
- `DELETE /records/by-filter` - Delete by metadata criteria
- `GET /records/deletion-preview` - Preview multiple deletion methods