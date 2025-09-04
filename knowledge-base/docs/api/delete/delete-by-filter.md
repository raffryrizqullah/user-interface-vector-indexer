# DELETE /records/by-filter

Delete vectors berdasarkan metadata filter criteria dengan advanced filtering support.

## Endpoint
```
DELETE /records/by-filter
```

## Description
Endpoint ini menghapus vectors berdasarkan metadata filter expressions. Sangat powerful untuk bulk deletion berdasarkan attributes seperti author, category, tags, atau custom metadata fields.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metadata_filter` | String | ✅ | JSON metadata filter expression |
| `namespace` | String | ❌ | Namespace (default: "default") |
| `dry_run` | Boolean | ❌ | Preview mode without deletion (default: false) |
| `confirm` | Boolean | ❌ | Confirmation for deletion (required for actual delete) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_metadata_filter",
  "dry_run": false,
  "message": "Successfully deleted vectors matching filter from namespace 'default'",
  "metadata_filter": {
    "author": {"$eq": "John Doe"}
  },
  "delete_response": "Delete completed"
}
```

### Dry Run Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "operation": "delete_by_metadata_filter",
  "dry_run": true,
  "message": "DRY RUN: Would delete all vectors matching filter in namespace 'default'",
  "metadata_filter": {
    "author": {"$eq": "John Doe"}
  },
  "warning": "Cannot preview exact count for metadata filter without executing query"
}
```

### Error Response (400/500)
```json
{
  "detail": "Invalid metadata filter JSON format"
}
```

## Metadata Filter Syntax

### Basic Equality
```json
{
  "author": {"$eq": "John Doe"}
}
```

### Multiple Conditions (AND)
```json
{
  "author": {"$eq": "John Doe"},
  "category": {"$eq": "tutorial"}
}
```

### In Array
```json
{
  "category": {"$in": ["tutorial", "guide", "manual"]}
}
```

### Not Equal
```json
{
  "is_public": {"$ne": true}
}
```

### Range Queries
```json
{
  "version": {"$gte": 2.0}
}
```

### Text Contains
```json
{
  "document_title": {"$eq": "User Guide"}
}
```

## cURL Examples

### Delete by Author
```bash
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "John Doe"}}' \
  --data-urlencode 'confirm=true'
```

### Delete by Category (Dry Run)
```bash
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"category": {"$eq": "draft"}}' \
  --data-urlencode 'dry_run=true'
```

### Delete Multiple Categories
```bash
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"category": {"$in": ["draft", "test", "temp"]}}' \
  --data-urlencode 'confirm=true'
```

### Delete by Tags
```bash
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"tags": {"$in": ["deprecated"]}}' \
  --data-urlencode 'confirm=true'
```

### Delete Non-public Documents
```bash
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"is_public": {"$eq": false}}' \
  --data-urlencode 'confirm=true'
```

### Complex Filter
```bash
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={
    "author": {"$eq": "Test User"},
    "category": {"$in": ["test", "draft"]},
    "version": {"$lt": 1.0}
  }' \
  --data-urlencode 'confirm=true'
```

## Use Cases

### Content Moderation
```bash
# Remove inappropriate content
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"status": {"$eq": "flagged"}}' \
  --data-urlencode 'confirm=true'
```

### Cleanup by Author
```bash
# Remove all content dari specific author
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "former_employee@company.com"}}' \
  --data-urlencode 'dry_run=true'

# After review, execute
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "former_employee@company.com"}}' \
  --data-urlencode 'confirm=true'
```

### Version Cleanup
```bash
# Remove old versions
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"version": {"$lt": 2.0}}' \
  --data-urlencode 'confirm=true'
```

### Tag-based Cleanup
```bash
# Remove deprecated content
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"tags": {"$in": ["deprecated", "obsolete"]}}' \
  --data-urlencode 'confirm=true'
```

### Development Cleanup
```bash
# Remove test data
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={
    "environment": {"$eq": "test"},
    "created_by": {"$eq": "automated_test"}
  }' \
  --data-urlencode 'confirm=true'
```

## Advanced Examples

### Batch Content Management
```bash
#!/bin/bash
# content-cleanup.sh

# Function to delete by filter with confirmation
delete_by_filter() {
  local filter="$1"
  local description="$2"
  
  echo "=== $description ==="
  echo "Filter: $filter"
  
  # Dry run first
  curl -s -X DELETE "http://localhost:8000/records/by-filter" \
    --data-urlencode "metadata_filter=$filter" \
    --data-urlencode "dry_run=true" | \
    jq '.message'
  
  read -p "Proceed with deletion? (y/N): " confirm
  if [ "$confirm" = "y" ]; then
    curl -X DELETE "http://localhost:8000/records/by-filter" \
      --data-urlencode "metadata_filter=$filter" \
      --data-urlencode "confirm=true"
    echo "✅ Completed: $description"
  else
    echo "❌ Skipped: $description"
  fi
  echo
}

# Cleanup scenarios
delete_by_filter '{"category": {"$eq": "draft"}}' "Remove draft documents"
delete_by_filter '{"is_public": {"$eq": false}, "author": {"$eq": "test_user"}}' "Remove private test documents"
delete_by_filter '{"tags": {"$in": ["deprecated", "obsolete"]}}' "Remove deprecated content"
```

### Environment-specific Cleanup
```bash
# Production cleanup
PROD_FILTER='{"environment": {"$eq": "production"}, "status": {"$eq": "archived"}}'
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode "metadata_filter=$PROD_FILTER" \
  --data-urlencode "namespace=production" \
  --data-urlencode "confirm=true"

# Development cleanup
DEV_FILTER='{"created_at": {"$lt": "2024-01-01"}}'
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode "metadata_filter=$DEV_FILTER" \
  --data-urlencode "namespace=development" \
  --data-urlencode "confirm=true"
```

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal to | `{"status": {"$eq": "published"}}` |
| `$ne` | Not equal to | `{"status": {"$ne": "draft"}}` |
| `$in` | In array | `{"category": {"$in": ["news", "blog"]}}` |
| `$nin` | Not in array | `{"category": {"$nin": ["private"]}}` |
| `$gt` | Greater than | `{"score": {"$gt": 0.8}}` |
| `$gte` | Greater than or equal | `{"version": {"$gte": 2.0}}` |
| `$lt` | Less than | `{"priority": {"$lt": 5}}` |
| `$lte` | Less than or equal | `{"rating": {"$lte": 3.0}}` |

## Data Type Examples

### String Fields
```bash
# Exact match
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"document_title": {"$eq": "User Manual v1.0"}}' \
  --data-urlencode 'dry_run=true'
```

### Boolean Fields
```bash
# Boolean filtering
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"is_public": {"$eq": false}}' \
  --data-urlencode 'dry_run=true'
```

### Numeric Fields
```bash
# Numeric comparison
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"version": {"$lt": 1.5}}' \
  --data-urlencode 'dry_run=true'
```

### Array Fields (Tags)
```bash
# Array contains
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"tags": {"$in": ["beta", "experimental"]}}' \
  --data-urlencode 'dry_run=true'
```

## Error Handling

### Invalid JSON
```bash
# Malformed JSON
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={invalid json}' \
  --data-urlencode 'confirm=true'
# Returns: 400 "Invalid metadata filter JSON format"
```

### Missing Confirmation
```bash
# No confirmation
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "test"}}}'
# Returns: 400 "Deletion requires confirmation. Set confirm=true to proceed."
```

### Complex Filter Debugging
```bash
# Test filter step by step
echo '{"author": {"$eq": "John Doe"}}' | jq '.'  # Validate JSON first

# Test with dry run
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "John Doe"}}' \
  --data-urlencode 'dry_run=true'
```

## Safety Considerations

### Preview Limitations
- Metadata filter previews cannot show exact count without execution
- Always test with small datasets first
- Use dry run to validate filter syntax

### Best Practices
```bash
# 1. Test filter on small dataset first
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"test_field": {"$eq": "test_value"}}' \
  --data-urlencode 'namespace=testing' \
  --data-urlencode 'dry_run=true'

# 2. Use specific filters to avoid accidental mass deletion
# Good: Specific filter
{"author": {"$eq": "specific_user"}, "category": {"$eq": "draft"}}

# Risky: Too broad filter
{"category": {"$ne": "important"}}
```

### Recovery Considerations
```bash
# Before bulk deletion, consider export
curl "http://localhost:8000/records/search?prefix=author_content" > backup.json

# Then proceed with deletion
curl -X DELETE "http://localhost:8000/records/by-filter" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "leaving_author"}}' \
  --data-urlencode 'confirm=true'
```

## Performance Tips
- Use specific filters untuk better performance
- Avoid overly broad filters yang could match many vectors
- Test filters dalam development environment first
- Consider batch deletion untuk very large datasets

## Related Endpoints
- `GET /records/fetch` - Check metadata before deletion
- `DELETE /records/by-document` - Delete entire documents
- `GET /records/deletion-preview` - Preview multiple deletion methods
- `DELETE /records/by-ids` - Delete specific vectors by IDs