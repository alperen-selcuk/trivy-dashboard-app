# Design Document: Admin Authentication and Scan Management

## Overview

This design implements a secure authentication system with an admin account (trivy/trivy) that allows administrators to manage scan data. The system includes login/logout functionality, session management, and secure delete operations with proper authorization checks.

## Architecture

### Authentication Flow

```
User Access Dashboard
    ↓
Check Session Token
    ↓
Token Valid?
├─ Yes → Display Dashboard
└─ No → Display Login Page
    ↓
User Enters Credentials
    ↓
Validate Against Admin Account
    ↓
Credentials Valid?
├─ Yes → Create Session Token
│        Store in localStorage/sessionStorage
│        Redirect to Dashboard
└─ No → Display Error Message
```

### Delete Operation Flow

```
Admin Clicks Delete Button
    ↓
Display Confirmation Dialog
    ↓
Admin Confirms
    ↓
Send DELETE Request with Auth Token
    ↓
Backend Validates Token
    ↓
Token Valid & Admin?
├─ Yes → Delete from Database
│        Log Action
│        Return Success
└─ No → Return 401/403 Error
    ↓
Frontend Updates UI
```

## Components and Interfaces

### Frontend Components

#### 1. LoginPage Component
```javascript
<LoginPage
  onLogin={handler}
  onError={handler}
/>
```

#### 2. AuthContext
```javascript
const AuthContext = {
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (username, password) => Promise,
  logout: () => void,
  isAdmin: () => boolean
}
```

#### 3. ProtectedRoute Component
```javascript
<ProtectedRoute
  component={Component}
  requiredRole="admin" | "user"
/>
```

#### 4. DeleteButton Component
```javascript
<DeleteButton
  scanId={number}
  onDelete={handler}
  onError={handler}
/>
```

#### 5. ConfirmDialog Component
```javascript
<ConfirmDialog
  title={string}
  message={string}
  onConfirm={handler}
  onCancel={handler}
/>
```

### Backend Components

#### 1. User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    role = Column(String)  # "admin", "user"
    created_at = Column(DateTime)
```

#### 2. Authentication Service
```python
class AuthService:
    def create_admin_account() -> None
    def authenticate(username: str, password: str) -> User | None
    def verify_token(token: str) -> User | None
    def create_token(user: User) -> str
    def hash_password(password: str) -> str
    def verify_password(password: str, hash: str) -> bool
```

#### 3. Authorization Middleware
```python
class AuthMiddleware:
    def verify_admin_access(token: str) -> bool
    def verify_user_access(token: str) -> bool
    def log_action(user: User, action: str, resource: str) -> None
```

#### 4. Enhanced API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token
- `DELETE /api/scan-results/{id}` - Delete scan (admin only)
- `GET /api/audit-logs` - View audit logs (admin only)

## Data Models

### Login Request
```json
{
  "username": "trivy",
  "password": "trivy"
}
```

### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "trivy",
    "role": "admin"
  }
}
```

### Audit Log Entry
```json
{
  "id": 1,
  "user_id": 1,
  "action": "delete_scan",
  "resource": "scan_result_123",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "success" | "failure",
  "details": "Deleted scan for nginx:1.19"
}
```

## Security Specifications

### Password Security
- Minimum 8 characters
- Hash using bcrypt with salt rounds = 10
- Never store plain text passwords
- Default admin password: "trivy" (must be changed in production)

### Token Security
- Use JWT (JSON Web Tokens)
- Token expiration: 24 hours
- Refresh token mechanism for extended sessions
- Store token in httpOnly cookie (if possible) or localStorage

### Authorization Rules
- Only authenticated users can access dashboard
- Only admin users can delete scans
- All admin actions are logged
- Failed login attempts are logged

### CORS and CSRF Protection
- CORS headers properly configured
- CSRF tokens for state-changing operations
- Same-site cookie policy

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.

### Property 1: Admin Account Creation
**For any** system initialization, an admin account with username "trivy" should be created exactly once, and subsequent initializations should not create duplicates.

**Validates: Requirements 2.1, 2.2**

### Property 2: Authentication Validation
**For any** login attempt with correct credentials, the system should return a valid token; with incorrect credentials, it should return an error.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: Session Persistence
**For any** authenticated user, the session should persist across page reloads until explicitly logged out or token expires.

**Validates: Requirements 1.4, 1.5**

### Property 4: Delete Authorization
**For any** delete request, the system should only process it if the user is authenticated and has admin role; otherwise return 401/403.

**Validates: Requirements 4.1, 4.2, 5.1, 5.2**

### Property 5: Audit Logging
**For any** admin action (delete), the system should create an audit log entry with user, action, resource, and timestamp.

**Validates: Requirements 5.3, 5.4**

### Property 6: Unauthenticated Access Prevention
**For any** unauthenticated user attempting to access protected endpoints, the system should return 401 Unauthorized.

**Validates: Requirements 5.1**

## Error Handling

1. **Invalid Credentials**: Display "Invalid username or password"
2. **Token Expired**: Redirect to login page
3. **Unauthorized Access**: Display "Access denied"
4. **Delete Failure**: Display error message and retry option
5. **Database Error**: Display generic error message, log details

## Testing Strategy

### Unit Tests
- Test password hashing and verification
- Test token creation and validation
- Test admin account creation
- Test authorization checks
- Test audit logging

### Property-Based Tests
- **Property 1**: Generate initialization scenarios, verify single admin creation
- **Property 2**: Generate login attempts, verify authentication logic
- **Property 3**: Generate session operations, verify persistence
- **Property 4**: Generate delete requests, verify authorization
- **Property 5**: Generate admin actions, verify audit logs
- **Property 6**: Generate unauthenticated requests, verify rejection

### Integration Tests
- Test full login/logout flow
- Test delete operation with authorization
- Test session persistence
- Test audit log creation
- Test with multiple concurrent users

### Security Tests
- Test password strength validation
- Test token expiration
- Test CSRF protection
- Test SQL injection prevention
- Test unauthorized access attempts

