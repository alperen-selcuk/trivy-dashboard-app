# Implementation Plan: Admin Authentication and Scan Management

## Overview

This implementation plan breaks down the admin authentication feature into discrete coding tasks. The approach focuses on backend authentication system first, then frontend login UI and delete functionality.

## Tasks

- [x] 1. Create User model and database migration
  - Create User SQLAlchemy model with username, password_hash, role fields
  - Create database migration for users table
  - Add indexes for username field
  - _Requirements: 2.1, 2.2_

- [x] 2. Create authentication service
  - Create `AuthService` class with authentication methods
  - Implement `create_admin_account()` to create default admin
  - Implement `authenticate()` for login validation
  - Implement password hashing with bcrypt
  - _Requirements: 2.1, 2.2, 1.1_

- [x]* 2.1 Write property tests for auth service
  - **Property 1: Admin Account Creation**
  - **Property 2: Authentication Validation**
  - **Validates: Requirements 2.1, 1.1**

- [x] 3. Create JWT token management
  - Implement `create_token()` to generate JWT tokens
  - Implement `verify_token()` to validate tokens
  - Set token expiration to 24 hours
  - _Requirements: 1.1, 1.2_

- [x] 4. Create authentication middleware
  - Create middleware to verify tokens on protected endpoints
  - Implement authorization checks for admin role
  - Return 401/403 errors appropriately
  - _Requirements: 5.1, 5.2, 5.3_

- [x]* 4.1 Write property tests for middleware
  - **Property 4: Delete Authorization**
  - **Property 6: Unauthenticated Access Prevention**
  - **Validates: Requirements 5.1, 5.2**

- [x] 5. Create audit logging service
  - Create `AuditLog` model for logging admin actions
  - Implement `log_action()` to record actions
  - Include user, action, resource, timestamp
  - _Requirements: 5.3, 5.4_

- [x] 6. Create login API endpoint
  - Create `POST /api/auth/login` endpoint
  - Validate credentials
  - Return JWT token on success
  - Return error on failure
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Create logout API endpoint
  - Create `POST /api/auth/logout` endpoint
  - Invalidate token (optional, depends on implementation)
  - Return success response
  - _Requirements: 1.5, 1.6_

- [x] 8. Create token verification endpoint
  - Create `GET /api/auth/verify` endpoint
  - Verify token validity
  - Return user info if valid
  - _Requirements: 1.1_

- [x] 9. Create delete scan endpoint
  - Create `DELETE /api/scan-results/{id}` endpoint
  - Verify admin authorization
  - Delete from database
  - Log action
  - _Requirements: 4.1, 4.2, 4.3, 5.3_

- [x]* 9.1 Write property tests for delete endpoint
  - **Property 5: Audit Logging**
  - **Validates: Requirements 5.3, 5.4**

- [x] 10. Create LoginPage component
  - Create React component for login form
  - Implement username and password inputs
  - Add submit button
  - _Requirements: 1.1_

- [x] 11. Implement login form submission
  - Connect form to login API endpoint
  - Handle success (store token, redirect)
  - Handle error (display error message)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 12. Create AuthContext for state management
  - Create React context for authentication state
  - Implement login/logout functions
  - Implement token persistence
  - _Requirements: 1.4, 1.5_

- [x] 13. Create ProtectedRoute component
  - Create component to protect routes
  - Check authentication status
  - Redirect to login if not authenticated
  - _Requirements: 1.1_

- [x] 14. Implement session persistence
  - Store token in localStorage/sessionStorage
  - Restore session on page load
  - Verify token validity
  - _Requirements: 1.4, 1.5_

- [x] 15. Create logout functionality
  - Add logout button to dashboard
  - Implement logout handler
  - Clear token and redirect to login
  - _Requirements: 1.5, 1.6_

- [x] 16. Create DeleteButton component
  - Create button component for delete action
  - Add confirmation dialog
  - Implement delete handler
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 17. Integrate delete button into DataGrid
  - Add delete button to each scan row
  - Show only for authenticated admins
  - Handle delete response
  - _Requirements: 3.1, 3.2_

- [x] 18. Implement delete confirmation dialog
  - Create confirmation dialog component
  - Display warning message
  - Implement confirm/cancel handlers
  - _Requirements: 3.1_

- [x] 19. Implement delete operation
  - Send DELETE request to backend
  - Handle success (remove from UI, show message)
  - Handle error (display error message)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 20. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify authentication and delete functionality

- [x] 21. Test full authentication flow
  - Test login with correct credentials
  - Test login with incorrect credentials
  - Test session persistence
  - Test logout
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 22. Test delete functionality
  - Test delete with admin account
  - Test delete without authentication
  - Test delete confirmation
  - Verify database deletion
  - _Requirements: 4.1, 4.2, 4.3, 5.3_

- [x]* 22.1 Write integration tests
  - Test full login/logout flow
  - Test delete operation with authorization
  - Test audit logging

