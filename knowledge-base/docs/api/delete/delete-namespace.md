# DELETE /namespaces/{namespace}

Delete semua vectors dalam namespace - DESTRUCTIVE OPERATION dengan confirmation token requirement.

## Endpoint
```
DELETE /namespaces/{namespace}
```

## Description
Endpoint ini menghapus SEMUA vectors dalam specified namespace. Ini adalah DESTRUCTIVE OPERATION yang tidak dapat di-undo dan memerlukan confirmation token yang spesifik untuk keamanan.

## Request

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | ✅ | Namespace untuk delete semua vectors |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirmation_token` | String | ✅ | Required token: `DELETE_ALL_{NAMESPACE}` |
| `dry_run` | Boolean | ❌ | Preview mode without deletion (default: false) |

## Response

### Success Response (200)
```json
{
  "success": true,
  "namespace": "testing",
  "operation": "delete_all_in_namespace",
  "dry_run": false,
  "confirmation_token": "DELETE_ALL_TESTING",
  "delete_response": "Delete all completed",
  "message": "Successfully deleted ALL vectors from namespace 'testing'",
  "warning": "This was a DESTRUCTIVE operation - all data in namespace has been removed"
}
```

### Dry Run Response (200)
```json
{
  "success": true,
  "namespace": "testing",
  "dry_run": true,
  "current_vector_count": 1247,
  "message": "DRY RUN: Would delete ALL 1247 vectors from namespace 'testing'",
  "warning": "This is a DESTRUCTIVE operation that cannot be undone!",
  "required_confirmation": "DELETE_ALL_TESTING"
}
```

### Error Response (400/500)
```json
{
  "detail": "Confirmation required. Use confirmation_token='DELETE_ALL_TESTING'"
}
```

## cURL Examples

### Dry Run Preview
```bash
curl -X DELETE "http://localhost:8000/namespaces/testing?dry_run=true"
```

### Delete All Vectors (with Confirmation)
```bash
curl -X DELETE "http://localhost:8000/namespaces/testing?confirmation_token=DELETE_ALL_TESTING"
```

### Delete Production Namespace
```bash
curl -X DELETE "http://localhost:8000/namespaces/production?confirmation_token=DELETE_ALL_PRODUCTION"
```

## Confirmation Token Format

The confirmation token follows the pattern: `DELETE_ALL_{NAMESPACE_UPPERCASE}`

### Examples
| Namespace | Required Token |
|-----------|----------------|
| `default` | `DELETE_ALL_DEFAULT` |
| `testing` | `DELETE_ALL_TESTING` |
| `production` | `DELETE_ALL_PRODUCTION` |
| `dev-env` | `DELETE_ALL_DEV-ENV` |

## Safety Features

### Confirmation Required
```bash
# This will fail - no confirmation
curl -X DELETE "http://localhost:8000/namespaces/testing"
# Returns: "Confirmation required. Use confirmation_token='DELETE_ALL_TESTING'"

# This will succeed
curl -X DELETE "http://localhost:8000/namespaces/testing?confirmation_token=DELETE_ALL_TESTING"
```

### Dry Run Mode
```bash
# Always preview first
curl -X DELETE "http://localhost:8000/namespaces/important?dry_run=true"

# Review the output, then proceed
curl -X DELETE "http://localhost:8000/namespaces/important?confirmation_token=DELETE_ALL_IMPORTANT"
```

## Use Cases

### Development Environment Reset
```bash
# Reset development namespace
echo "Resetting development environment..."
curl -s "http://localhost:8000/namespaces/development?dry_run=true" | jq '.current_vector_count'

curl -X DELETE "http://localhost:8000/namespaces/development?confirmation_token=DELETE_ALL_DEVELOPMENT"
echo "✅ Development environment reset"
```

### Testing Cleanup
```bash
# Clean up after testing
curl -X DELETE "http://localhost:8000/namespaces/testing?confirmation_token=DELETE_ALL_TESTING"
```

### Namespace Migration Preparation
```bash
# Clear target namespace before migration
curl -X DELETE "http://localhost:8000/namespaces/migration_target?confirmation_token=DELETE_ALL_MIGRATION_TARGET"
```

### Complete Environment Teardown
```bash
#!/bin/bash
# teardown-environment.sh

ENVIRONMENT="$1"
if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: $0 <environment>"
  echo "Example: $0 staging"
  exit 1
fi

NAMESPACE="$ENVIRONMENT"
TOKEN="DELETE_ALL_$(echo $NAMESPACE | tr '[:lower:]' '[:upper:]')"

echo "=== Environment Teardown ==="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "Required token: $TOKEN"

# Preview what will be deleted
echo "Getting current status..."
PREVIEW=$(curl -s "http://localhost:8000/namespaces/$NAMESPACE?dry_run=true")
COUNT=$(echo "$PREVIEW" | jq -r '.current_vector_count // 0')

echo "Current vectors in '$NAMESPACE': $COUNT"

if [ "$COUNT" -gt 0 ]; then
  echo "⚠️  WARNING: This will delete ALL $COUNT vectors in namespace '$NAMESPACE'"
  read -p "Type 'DELETE ALL' to confirm: " confirmation
  
  if [ "$confirmation" = "DELETE ALL" ]; then
    echo "Executing teardown..."
    curl -X DELETE "http://localhost:8000/namespaces/$NAMESPACE?confirmation_token=$TOKEN"
    echo "✅ Environment '$ENVIRONMENT' has been completely reset"
  else
    echo "❌ Teardown cancelled - confirmation not provided"
  fi
else
  echo "Namespace '$NAMESPACE' is already empty"
fi
```

## Advanced Examples

### Batch Environment Reset
```bash
#!/bin/bash
# reset-all-environments.sh

# List of environments to reset
ENVIRONMENTS=(
  "development"
  "testing"
  "staging"
  "temp"
)

for env in "${ENVIRONMENTS[@]}"; do
  echo "=== Resetting environment: $env ==="
  
  # Check current status
  PREVIEW=$(curl -s "http://localhost:8000/namespaces/$env?dry_run=true")
  COUNT=$(echo "$PREVIEW" | jq -r '.current_vector_count // 0')
  
  if [ "$COUNT" -gt 0 ]; then
    echo "📊 Environment '$env' has $COUNT vectors"
    
    read -p "Reset environment '$env'? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
      TOKEN="DELETE_ALL_$(echo $env | tr '[:lower:]' '[:upper:]')"
      curl -X DELETE "http://localhost:8000/namespaces/$env?confirmation_token=$TOKEN"
      echo "✅ Reset: $env"
    else
      echo "⏭️  Skipped: $env"
    fi
  else
    echo "Environment '$env' is already empty"
  fi
  echo
done
```

### Conditional Namespace Cleanup
```bash
#!/bin/bash
# conditional-namespace-cleanup.sh

NAMESPACE="$1"
MAX_VECTORS="${2:-1000}"

if [ -z "$NAMESPACE" ]; then
  echo "Usage: $0 <namespace> [max_vectors]"
  exit 1
fi

echo "Checking namespace '$NAMESPACE' for cleanup..."

# Get current vector count
PREVIEW=$(curl -s "http://localhost:8000/namespaces/$NAMESPACE?dry_run=true")
COUNT=$(echo "$PREVIEW" | jq -r '.current_vector_count // 0')

echo "Current vectors: $COUNT"
echo "Threshold: $MAX_VECTORS"

if [ "$COUNT" -gt "$MAX_VECTORS" ]; then
  echo "⚠️  Namespace '$NAMESPACE' exceeds threshold ($COUNT > $MAX_VECTORS)"
  echo "Recommend cleanup or archival before proceeding"
  
  read -p "Force cleanup despite high vector count? (y/N): " force
  if [ "$force" = "y" ]; then
    TOKEN="DELETE_ALL_$(echo $NAMESPACE | tr '[:lower:]' '[:upper:]')"
    curl -X DELETE "http://localhost:8000/namespaces/$NAMESPACE?confirmation_token=$TOKEN"
    echo "✅ Forced cleanup completed"
  else
    echo "❌ Cleanup cancelled"
  fi
else
  echo "✅ Namespace size is acceptable"
fi
```

### Backup Before Delete
```bash
#!/bin/bash
# backup-and-delete-namespace.sh

NAMESPACE="$1"
BACKUP_DIR="${2:-./backups}"

if [ -z "$NAMESPACE" ]; then
  echo "Usage: $0 <namespace> [backup_dir]"
  exit 1
fi

echo "=== Backup and Delete Namespace ==="
echo "Namespace: $NAMESPACE"
echo "Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Get namespace info
PREVIEW=$(curl -s "http://localhost:8000/namespaces/$NAMESPACE?dry_run=true")
COUNT=$(echo "$PREVIEW" | jq -r '.current_vector_count // 0')

if [ "$COUNT" -eq 0 ]; then
  echo "Namespace '$NAMESPACE' is empty - no backup needed"
  exit 0
fi

echo "📦 Backing up $COUNT vectors from namespace '$NAMESPACE'..."

# Backup vectors (conceptual - actual implementation would need vector export)
BACKUP_FILE="$BACKUP_DIR/namespace_${NAMESPACE}_$(date +%Y%m%d_%H%M%S).json"
echo "Creating backup: $BACKUP_FILE"

# Note: This is conceptual - you'd need actual vector export functionality
curl -s "http://localhost:8000/records?namespace=$NAMESPACE&limit=1000" > "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE"

# Confirm deletion
read -p "Backup complete. Delete namespace '$NAMESPACE'? (y/N): " confirm
if [ "$confirm" = "y" ]; then
  TOKEN="DELETE_ALL_$(echo $NAMESPACE | tr '[:lower:]' '[:upper:]')"
  curl -X DELETE "http://localhost:8000/namespaces/$NAMESPACE?confirmation_token=$TOKEN"
  echo "✅ Namespace '$NAMESPACE' deleted"
  echo "📁 Backup available at: $BACKUP_FILE"
else
  echo "❌ Deletion cancelled - backup preserved"
fi
```

## Error Handling

### Invalid Confirmation Token
```bash
curl -X DELETE "http://localhost:8000/namespaces/testing?confirmation_token=WRONG_TOKEN"
# Returns: 400 "Confirmation required. Use confirmation_token='DELETE_ALL_TESTING'"
```

### Namespace Not Found
```bash
curl -X DELETE "http://localhost:8000/namespaces/nonexistent?confirmation_token=DELETE_ALL_NONEXISTENT"
# Succeeds but deletes 0 vectors
```

### Missing Confirmation
```bash
curl -X DELETE "http://localhost:8000/namespaces/testing"
# Returns: 400 "Confirmation required. Use confirmation_token='DELETE_ALL_TESTING'"
```

### Network Issues
```bash
# Handle timeouts for large namespaces
timeout 300 curl -X DELETE "http://localhost:8000/namespaces/large?confirmation_token=DELETE_ALL_LARGE" || \
  echo "Deletion timed out - operation may still be in progress"
```

## Validation Rules
- Namespace parameter required in URL path
- Confirmation token must match `DELETE_ALL_{NAMESPACE_UPPERCASE}` pattern
- Dry run mode available for safety preview
- No confirmation required for dry run
- Operation is irreversible once executed

## Response Fields

| Field | Description |
|-------|-------------|
| `namespace` | The namespace that was processed |
| `confirmation_token` | The token used for confirmation |
| `current_vector_count` | Number of vectors before deletion (dry run only) |
| `delete_response` | Pinecone API response (actual deletion) |
| `warning` | Warning about destructive nature of operation |

## Best Practices

### Safety Protocol
1. **Always use dry run first**: Preview the operation
2. **Verify namespace**: Double-check you're targeting the right namespace
3. **Consider backup**: For important data, backup before deletion
4. **Use descriptive namespaces**: Make it clear what each namespace contains

### Operational Guidelines
```bash
# Good: Clear development workflow
curl -s "http://localhost:8000/namespaces/development?dry_run=true"  # Preview
curl -X DELETE "http://localhost:8000/namespaces/development?confirmation_token=DELETE_ALL_DEVELOPMENT"  # Execute

# Avoid: Deleting production without careful consideration
curl -X DELETE "http://localhost:8000/namespaces/production?confirmation_token=DELETE_ALL_PRODUCTION"
```

### Recovery Considerations
- **No recovery**: Once deleted, vectors cannot be recovered
- **Backup strategy**: Implement backup before deletion for critical namespaces
- **Staging first**: Test deletion process in staging environment

## Security Considerations

### Access Control
- Ensure proper authentication for namespace deletion endpoints
- Consider role-based access for destructive operations
- Log all namespace deletion operations for audit

### Confirmation Token Security
- Tokens are case-sensitive and must match exactly
- Tokens include namespace name to prevent accidental cross-namespace deletion
- No way to bypass confirmation requirement

## Performance Impact

### Large Namespaces
- Deletion of large namespaces may take significant time
- Monitor operation progress through logs
- Consider chunked deletion for extremely large namespaces

### Pinecone Consistency
- Deletion is eventually consistent
- Allow time for operation to complete
- Verify deletion success with subsequent queries

## Related Endpoints
- `GET /namespaces` - List available namespaces
- `GET /namespaces/{namespace}/stats` - Get namespace statistics
- `DELETE /records/by-filter` - Delete by metadata criteria
- `GET /records/deletion-preview` - Preview deletion operations