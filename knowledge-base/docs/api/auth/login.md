# Authentication - Login

Login endpoint untuk authenticate user dan mendapatkan JWT tokens.

## Endpoint

```
POST /auth/login
```

## Request

### Headers
```
Content-Type: application/json
```

### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string (email) | ✅ | User email address |
| `password` | string | ✅ | User password |

### Example Request
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Password123!"
  }'
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "c67ed3b7-d4fb-43a7-b1ff-d40f6aef1f16",
    "username": "testadmin",
    "email": "admin@test.com",
    "role": "super_admin",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-09-04T05:26:21.475978Z",
    "last_login": "2025-09-04T05:26:21.475978Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800
  }
}
```

### Error Responses

**401 Unauthorized - Invalid Credentials**
```json
{
  "detail": "Invalid credentials"
}
```

**403 Forbidden - Inactive Account**
```json
{
  "detail": "Account is inactive"
}
```

**422 Validation Error**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "email"],
      "msg": "Field required"
    }
  ]
}
```

## Usage Notes

- Access tokens expire in 30 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Session information (IP, User Agent) is tracked for security
- `last_login` timestamp is updated upon successful login
- Tokens must be included in `Authorization` header for protected endpoints

## Authentication Flow

1. **Login**: Send email/password to get tokens
2. **Access Protected Resources**: Include access token in requests
3. **Token Refresh**: Use refresh token to get new access token when expired
4. **Logout**: Invalidate refresh token when done

## Example Usage

```javascript
// JavaScript example
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Password123!'
  })
});

const { tokens } = await loginResponse.json();

// Use access token for subsequent requests
const protectedResponse = await fetch('/records', {
  headers: {
    'Authorization': `Bearer ${tokens.access_token}`
  }
});
```

## Security Considerations

- Always use HTTPS in production
- Store tokens securely (HttpOnly cookies recommended for web apps)
- Implement proper token refresh logic
- Monitor failed login attempts for security
- Consider implementing rate limiting for login attempts