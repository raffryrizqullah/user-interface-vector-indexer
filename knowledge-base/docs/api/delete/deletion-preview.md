# GET /records/deletion-preview

Preview multiple deletion methods dalam satu request untuk safety checking dan comparison.

## Endpoint
```
GET /records/deletion-preview
```

## Description
Endpoint ini menyediakan preview dari berbagai metode deletion dalam satu request. Sangat berguna untuk safety checking, comparison deletion methods, dan understanding impact sebelum melakukan actual deletion.

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | ❌ | Namespace (default: "default") |
| `vector_ids` | String | ❌ | Comma-separated list of vector IDs to preview |
| `metadata_filter` | String | ❌ | JSON metadata filter expression to preview |
| `prefix` | String | ❌ | ID prefix pattern to preview |
| `document_id` | String | ❌ | Document UUID to preview |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "default",
  "preview_results": [
    {
      "method": "by_ids",
      "result": {
        "success": true,
        "dry_run": true,
        "would_delete_count": 3,
        "existing_ids": ["doc1_0_abc", "doc1_1_def", "doc1_2_ghi"],
        "missing_ids": []
      }
    },
    {
      "method": "by_metadata_filter", 
      "result": {
        "success": true,
        "dry_run": true,
        "metadata_filter": {"author": {"$eq": "John Doe"}},
        "message": "DRY RUN: Would delete all vectors matching filter"
      }
    }
  ],
  "total_methods": 2,
  "message": "Deletion preview completed"
}
```

### Error Response (400/500)
```json
{
  "detail": "At least one deletion method parameter must be provided"
}
```

## cURL Examples

### Preview by Vector IDs
```bash
curl "http://localhost:8000/records/deletion-preview?vector_ids=doc1_0_abc,doc1_1_def,doc1_2_ghi"
```

### Preview by Metadata Filter
```bash
curl "http://localhost:8000/records/deletion-preview" \
  --data-urlencode 'metadata_filter={"author": {"$eq": "John Doe"}}'
```

### Preview by Prefix
```bash
curl "http://localhost:8000/records/deletion-preview?prefix=document.pdf"
```

### Preview by Document ID
```bash
curl "http://localhost:8000/records/deletion-preview?document_id=12345678-1234-1234-1234-123456789abc"
```

### Preview Multiple Methods
```bash
curl "http://localhost:8000/records/deletion-preview?prefix=temp_&vector_ids=specific_1,specific_2" \
  --data-urlencode 'metadata_filter={"category": {"$eq": "test"}}'
```

### Preview in Specific Namespace
```bash
curl "http://localhost:8000/records/deletion-preview?namespace=testing&prefix=test_"
```

## Use Cases

### Safety Verification
```bash
#!/bin/bash
# safety-check.sh

DOCUMENT_ID="12345678-1234-1234-1234-123456789abc"

echo "=== Deletion Safety Check ==="
echo "Document ID: $DOCUMENT_ID"

# Preview deletion
PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?document_id=$DOCUMENT_ID")

echo "Preview results:"
echo "$PREVIEW" | jq '.preview_results[] | {
  method: .method,
  success: .result.success,
  message: .result.message
}'

# Ask for confirmation
read -p "Proceed with deletion? (y/N): " confirm
if [ "$confirm" = "y" ]; then
  curl -X DELETE "http://localhost:8000/records/by-document?document_id=$DOCUMENT_ID&confirm=true"
  echo "✅ Deletion completed"
else
  echo "❌ Deletion cancelled"
fi
```

### Comparison of Methods
```bash
#!/bin/bash
# compare-deletion-methods.sh

PREFIX="test_document"
FILTER='{"category": {"$eq": "test"}}'

echo "=== Comparing Deletion Methods ==="

# Preview multiple methods
PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=$PREFIX" \
  --data-urlencode "metadata_filter=$FILTER")

echo "Method comparison:"
echo "$PREVIEW" | jq '.preview_results[] | {
  method: .method,
  would_delete: (.result.would_delete_count // .result.found_count // "unknown"),
  success: .result.success
}' | jq -s 'sort_by(.would_delete)'

echo "Choose the most appropriate method for your use case"
```

### Bulk Validation
```bash
#!/bin/bash
# bulk-validation.sh

# List of items to validate
ITEMS_TO_CHECK=(
  "prefix=old_doc"
  "prefix=temp_"
  "prefix=backup_"
)

for item in "${ITEMS_TO_CHECK[@]}"; do
  echo "=== Checking: $item ==="
  
  PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?$item")
  
  if echo "$PREVIEW" | jq -e '.success' > /dev/null; then
    METHOD=$(echo "$PREVIEW" | jq -r '.preview_results[0].method')
    COUNT=$(echo "$PREVIEW" | jq -r '.preview_results[0].result.would_delete_count // .preview_results[0].result.found_count // 0')
    
    echo "Method: $METHOD"
    echo "Would delete: $COUNT vectors"
    
    if [ "$COUNT" -gt 100 ]; then
      echo "⚠️  WARNING: Large deletion ($COUNT vectors)"
    elif [ "$COUNT" -eq 0 ]; then
      echo "ℹ️  No vectors found"
    else
      echo "✅ Safe deletion size"
    fi
  else
    echo "❌ Preview failed"
  fi
  echo
done
```

## Advanced Examples

### Interactive Deletion Wizard
```bash
#!/bin/bash
# deletion-wizard.sh

echo "=== Vector Deletion Wizard ==="
echo "Choose deletion method:"
echo "1. By Vector IDs"
echo "2. By Metadata Filter" 
echo "3. By Prefix Pattern"
echo "4. By Document ID"
echo "5. Compare Multiple Methods"

read -p "Enter choice (1-5): " choice

case $choice in
  1)
    read -p "Enter vector IDs (comma-separated): " ids
    PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?vector_ids=$ids")
    ;;
  2)
    read -p "Enter metadata filter JSON: " filter
    PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview" \
      --data-urlencode "metadata_filter=$filter")
    ;;
  3)
    read -p "Enter prefix pattern: " prefix
    PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=$prefix")
    ;;
  4)
    read -p "Enter document ID: " doc_id
    PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?document_id=$doc_id")
    ;;
  5)
    read -p "Enter prefix: " prefix
    read -p "Enter metadata filter: " filter
    PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=$prefix" \
      --data-urlencode "metadata_filter=$filter")
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo "=== Preview Results ==="
echo "$PREVIEW" | jq '.preview_results[]'

echo
read -p "Proceed with deletion using one of these methods? (y/N): " confirm
if [ "$confirm" = "y" ]; then
  echo "Choose which method to execute:"
  echo "$PREVIEW" | jq -r '.preview_results[] | "\(.method)"'
  read -p "Enter method name: " method
  echo "Execute the chosen method manually using the appropriate DELETE endpoint"
else
  echo "Preview only - no deletion performed"
fi
```

### Content Audit with Preview
```bash
#!/bin/bash
# content-audit.sh

NAMESPACE="${1:-default}"

echo "=== Content Audit for Namespace: $NAMESPACE ==="

# Categories to check
CATEGORIES=(
  "draft"
  "test" 
  "temp"
  "archived"
  "deprecated"
)

for category in "${CATEGORIES[@]}"; do
  echo "--- Checking category: $category ---"
  
  FILTER="{\"category\": {\"\\$eq\": \"$category\"}}"
  PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?namespace=$NAMESPACE" \
    --data-urlencode "metadata_filter=$FILTER")
  
  if echo "$PREVIEW" | jq -e '.success' > /dev/null; then
    echo "Preview successful for category: $category"
    echo "$PREVIEW" | jq '.preview_results[0].result.message'
  else
    echo "No vectors found for category: $category"
  fi
  echo
done

echo "=== Audit Summary ==="
echo "Review the categories above and choose which ones to clean up"
```

### Risk Assessment
```bash
#!/bin/bash
# risk-assessment.sh

PREFIX="$1"
if [ -z "$PREFIX" ]; then
  echo "Usage: $0 <prefix_pattern>"
  exit 1
fi

echo "=== Risk Assessment for Prefix: $PREFIX ==="

# Get preview
PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=$PREFIX")

if echo "$PREVIEW" | jq -e '.success' > /dev/null; then
  COUNT=$(echo "$PREVIEW" | jq -r '.preview_results[0].result.found_count // 0')
  
  echo "Vectors found: $COUNT"
  
  # Risk assessment
  if [ "$COUNT" -eq 0 ]; then
    echo "✅ SAFE: No vectors found"
  elif [ "$COUNT" -le 10 ]; then
    echo "✅ LOW RISK: Small number of vectors ($COUNT)"
  elif [ "$COUNT" -le 100 ]; then
    echo "⚠️  MEDIUM RISK: Moderate number of vectors ($COUNT)"
  elif [ "$COUNT" -le 1000 ]; then
    echo "⚠️  HIGH RISK: Large number of vectors ($COUNT)"
  else
    echo "🚨 CRITICAL RISK: Very large number of vectors ($COUNT)"
  fi
  
  # Show sample IDs
  if [ "$COUNT" -gt 0 ] && [ "$COUNT" -le 10 ]; then
    echo "Sample IDs:"
    echo "$PREVIEW" | jq -r '.preview_results[0].result.found_ids[]?' | head -5
  fi
else
  echo "❌ Preview failed"
  echo "$PREVIEW" | jq '.error // .detail'
fi
```

## Multi-Method Comparison

### Side-by-Side Analysis
```bash
#!/bin/bash
# compare-methods.sh

DOCUMENT_TITLE="User Manual"
PREFIX="user_manual.pdf"
FILTER='{"document_title": {"$eq": "User Manual"}}'

echo "=== Multi-Method Deletion Comparison ==="

# Compare prefix vs filter methods
PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=$PREFIX" \
  --data-urlencode "metadata_filter=$FILTER")

echo "Comparison results:"
echo "$PREVIEW" | jq '.preview_results[] | {
  method: .method,
  found_count: (.result.found_count // .result.would_delete_count // "N/A"),
  success: .result.success,
  message: .result.message
}'

echo
echo "Recommendation: Choose the method that gives you the most precise control"
```

### Overlap Detection
```bash
#!/bin/bash
# overlap-detection.sh

# Check for overlap between different deletion methods
IDS="doc1_0_abc,doc1_1_def"
PREFIX="doc1_"

echo "=== Overlap Detection ==="

PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?vector_ids=$IDS&prefix=$PREFIX")

if echo "$PREVIEW" | jq -e '.success' > /dev/null; then
  IDS_COUNT=$(echo "$PREVIEW" | jq -r '.preview_results[] | select(.method == "by_ids") | .result.would_delete_count')
  PREFIX_COUNT=$(echo "$PREVIEW" | jq -r '.preview_results[] | select(.method == "by_prefix") | .result.found_count')
  
  echo "By IDs would delete: $IDS_COUNT vectors"
  echo "By prefix would delete: $PREFIX_COUNT vectors"
  
  if [ "$PREFIX_COUNT" -gt "$IDS_COUNT" ]; then
    echo "⚠️  Prefix method would delete MORE vectors than IDs method"
    echo "Consider using the more specific IDs method"
  elif [ "$PREFIX_COUNT" -eq "$IDS_COUNT" ]; then
    echo "✅ Both methods would delete the same number of vectors"
  else
    echo "ℹ️  IDs method targets more specific vectors"
  fi
else
  echo "❌ Preview failed"
fi
```

## Response Analysis

### Parsing Preview Results
```bash
# Extract specific information from preview
PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=test_")

# Get total methods tested
TOTAL_METHODS=$(echo "$PREVIEW" | jq -r '.total_methods')

# Get success rate
SUCCESS_COUNT=$(echo "$PREVIEW" | jq '[.preview_results[] | select(.result.success == true)] | length')

echo "Methods tested: $TOTAL_METHODS"
echo "Successful previews: $SUCCESS_COUNT"
echo "Success rate: $(( SUCCESS_COUNT * 100 / TOTAL_METHODS ))%"

# Get detailed results
echo "$PREVIEW" | jq '.preview_results[] | {
  method: .method,
  vectors_affected: (.result.found_count // .result.would_delete_count // 0),
  preview_success: .result.success
}'
```

### Error Analysis
```bash
# Check for preview errors
PREVIEW=$(curl -s "http://localhost:8000/records/deletion-preview?prefix=invalid")

ERRORS=$(echo "$PREVIEW" | jq '[.preview_results[] | select(.result.success == false)]')

if [ "$(echo "$ERRORS" | jq 'length')" -gt 0 ]; then
  echo "Preview errors found:"
  echo "$ERRORS" | jq '.[] | {
    method: .method,
    error: .result.error
  }'
else
  echo "All preview methods succeeded"
fi
```

## Validation Rules
- At least one deletion method parameter must be provided
- Multiple methods can be previewed simultaneously
- All previews run in dry-run mode (no actual deletion)
- Results include success status for each method
- Invalid parameters are handled gracefully

## Response Fields

| Field | Description |
|-------|-------------|
| `preview_results` | Array of preview results for each method |
| `total_methods` | Number of deletion methods tested |
| `method` | Deletion method name (by_ids, by_filter, etc.) |
| `result` | Preview result for the specific method |

## Best Practices

### Safety Workflow
1. **Preview first**: Always use preview before deletion
2. **Compare methods**: Use multiple methods to find the best approach
3. **Validate results**: Check preview success and vector counts
4. **Choose wisely**: Select the most appropriate method

### Preview Patterns
```bash
# Good: Comprehensive preview
curl "http://localhost:8000/records/deletion-preview?prefix=test_&document_id=uuid"

# Good: Specific method preview  
curl "http://localhost:8000/records/deletion-preview?vector_ids=specific_id"

# Avoid: No parameters provided
curl "http://localhost:8000/records/deletion-preview"
```

### Decision Making
- Use preview results to choose the most appropriate deletion method
- Consider vector counts and precision needs
- Prefer more specific methods over broad patterns
- Always verify preview success before proceeding

## Related Endpoints
- `DELETE /records/by-ids` - Execute deletion by IDs
- `DELETE /records/by-filter` - Execute deletion by metadata filter
- `DELETE /records/by-prefix` - Execute deletion by prefix
- `DELETE /records/by-document` - Execute deletion by document ID