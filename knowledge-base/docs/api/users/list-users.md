# User Management - List Users

Get paginated list of users with optional filtering (Admin+ required).

## Endpoint

```
GET /users/
```

## Authorization

**Required Role:** `admin` or `super_admin`

### Headers
```
Authorization: Bearer <access_token>
```

## Request Parameters

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skip` | integer | ❌ | 0 | Number of users to skip for pagination |
| `limit` | integer | ❌ | 100 | Number of users to return (max: 1000) |
| `role` | enum | ❌ | - | Filter by role: `admin` or `super_admin` |
| `is_active` | boolean | ❌ | - | Filter by active status |

### Example Requests

**List all users (first 100)**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:8000/users/"
```

**List with pagination**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:8000/users/?skip=20&limit=10"
```

**Filter by role**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:8000/users/?role=super_admin"
```

**Filter by active status**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:8000/users/?is_active=true"
```

**Combined filters**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:8000/users/?role=admin&is_active=true&limit=50"
```

## Response

### Success Response (200 OK)
```json
[
  {
    "id": "c67ed3b7-d4fb-43a7-b1ff-d40f6aef1f16",
    "username": "testadmin",
    "email": "admin@test.com",
    "role": "super_admin",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-09-04T05:26:21.475978Z",
    "last_login": "2025-09-04T05:30:15.123456Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "docadmin",
    "email": "doc.admin@company.com",
    "role": "admin",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-09-04T10:30:00Z",
    "last_login": null
  }
]
```

### Error Responses

**401 Unauthorized - No Token**
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden - Insufficient Permissions**
```json
{
  "detail": "Insufficient permissions for this operation"
}
```

**422 Validation Error - Invalid Parameters**
```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["query", "limit"],
      "msg": "Input should be less than or equal to 1000"
    }
  ]
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique user identifier |
| `username` | string | User's unique username |
| `email` | string | User's email address |
| `role` | enum | User role (`admin` or `super_admin`) |
| `is_active` | boolean | Account active status |
| `is_verified` | boolean | Account verification status |
| `created_at` | datetime | Account creation timestamp |
| `last_login` | datetime/null | Last login timestamp |

## Usage Examples

### JavaScript/TypeScript
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

const getUsers = async (filters: {
  skip?: number;
  limit?: number;
  role?: string;
  is_active?: boolean;
} = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });
  
  const response = await fetch(`/users/?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return response.json() as Promise<User[]>;
};

// Usage
const adminUsers = await getUsers({ role: 'admin', is_active: true });
const paginatedUsers = await getUsers({ skip: 0, limit: 25 });
```

### Python
```python
import requests

def list_users(token, skip=0, limit=100, role=None, is_active=None):
    params = {'skip': skip, 'limit': limit}
    if role:
        params['role'] = role
    if is_active is not None:
        params['is_active'] = is_active
    
    response = requests.get(
        'http://localhost:8000/users/',
        params=params,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    return response.json()

# Usage
users = list_users(admin_token, role='super_admin')
active_users = list_users(admin_token, is_active=True, limit=50)
```

## Pagination Strategy

- **Default**: Returns first 100 users ordered by creation date (newest first)
- **Maximum**: Limit capped at 1000 users per request
- **Offset-based**: Use `skip` parameter for pagination
- **Total Count**: Not included in response (use separate count endpoint if needed)

## Performance Notes

- Results ordered by `created_at DESC` for consistent pagination
- Database indexes on `role`, `is_active`, and `created_at` for efficient filtering
- Consider implementing cursor-based pagination for large datasets
- Cache frequently accessed user lists when possible

## Security Considerations

- Sensitive fields (password hashes) excluded from response
- Only authenticated admin+ users can access
- No personal information beyond basic account details exposed
- Rate limiting recommended for production environments