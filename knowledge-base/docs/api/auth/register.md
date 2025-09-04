# Authentication - Register User

Create new user endpoint (Super Admin only).

## Endpoint

```
POST /auth/register
```

## Authorization

**Required Role:** `super_admin`

### Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

## Request

### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | ✅ | Unique username (alphanumeric + underscore) |
| `email` | string (email) | ✅ | Unique email address |
| `password` | string | ✅ | Password (min 8 chars, must contain number and letter) |
| `role` | enum | ❌ | User role: `admin` or `super_admin` (default: `admin`) |

### Example Request
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_access_token>" \
  -d '{
    "username": "newadmin",
    "email": "newadmin@company.com",
    "password": "SecurePass123!",
    "role": "admin"
  }'
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "newadmin",
    "email": "newadmin@company.com",
    "role": "admin",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-09-04T10:30:00Z",
    "last_login": null
  }
}
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

**409 Conflict - User Already Exists**
```json
{
  "detail": "User with this email already exists"
}
```

**400 Bad Request - Weak Password**
```json
{
  "detail": "Password validation failed: Password must contain at least one number"
}
```

**422 Validation Error**
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "password"],
      "msg": "String should have at least 8 characters"
    }
  ]
}
```

## Password Requirements

- Minimum 8 characters
- At least one letter (a-z, A-Z)
- At least one number (0-9)
- No maximum length limit

## User Roles

- **admin**: Access to all CRUD operations on documents and vectors
- **super_admin**: All admin permissions + user management capabilities

## Usage Examples

### Create Admin User
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_token>" \
  -d '{
    "username": "docadmin",
    "email": "doc.admin@company.com",
    "password": "AdminPass123!",
    "role": "admin"
  }'
```

### Create Super Admin User
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_token>" \
  -d '{
    "username": "superadmin2",
    "email": "super2@company.com",
    "password": "SuperSecure456!",
    "role": "super_admin"
  }'
```

## Business Logic

1. **Validation**: Email and username uniqueness checked
2. **Password Policy**: Enforced server-side validation
3. **Role Assignment**: Only super_admin can assign roles
4. **Account Status**: New users are active and verified by default
5. **Audit Trail**: Creation timestamp recorded

## Security Notes

- Only super admins can create new users
- Passwords are hashed using bcrypt before storage
- Duplicate email/username prevention
- Input sanitization and validation applied
- Rate limiting recommended for production