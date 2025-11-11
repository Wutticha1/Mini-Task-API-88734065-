# 📚 Mini Task API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Rate Limiting](#rate-limiting)
5. [Idempotency](#idempotency)
6. [Endpoints](#endpoints)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

---

## Overview

**Base URL:** `http://localhost:3000/api/v1`

Mini Task API is a comprehensive RESTful API for task management with:
- ✅ JWT Authentication (Access + Refresh tokens)
- ✅ RBAC (3 roles: user, premium, admin)
- ✅ ABAC (Attribute-based access control)
- ✅ Rate Limiting (3-tier by role)
- ✅ Idempotency (POST /tasks)
- ✅ Token Blacklist (Logout)

---

## Authentication

### Register User
Create new user account

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login
Authenticate and get tokens

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Token Expiry:**
- `accessToken`: 1 day
- `refreshToken`: 7 days

### Refresh Token
Get new access token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "message": "Access token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
Blacklist refresh token

```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Authorization

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **user** | - Create tasks (medium/low priority) - View own + public tasks - Update own tasks |
| **premium** | - Create tasks (any priority) - Higher rate limit (500 req/15min) |
| **admin** | - Manage users (GET/PUT/DELETE) - Manage any task - Unlimited rate limit |

### Attribute-Based Access Control (ABAC)

#### 1. High Priority Task Access
```
Only premium users and admin can create HIGH priority tasks
Users can create MEDIUM/LOW priority tasks
```

#### 2. Task Ownership
```
Owner: can view and edit own tasks
Others: can view only public tasks
Admin: can view/edit all tasks
```

#### 3. Premium Subscription
```
Premium users with expired subscription are blocked
Checked when accessing premium features
```

#### 4. Rate Limiting
```
Anonymous: 20 requests/15 minutes
User: 100 requests/15 minutes
Premium: 500 requests/15 minutes
Admin: Unlimited
```

---

## Rate Limiting

### Limits by Role

| Role | Limit | Window | Response |
|------|-------|--------|----------|
| Anonymous | 20 | 15 min | 429 Too Many Requests |
| User | 100 | 15 min | 429 Too Many Requests |
| Premium | 500 | 15 min | 429 Too Many Requests |
| Admin | Unlimited | - | Always allowed |

### Rate Limit Headers

Every response includes:
```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1699123456
```

### Rate Limit Exceeded (429)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 5 minutes",
    "retryAfter": 300,
    "timestamp": "2025-11-11T10:30:45.123Z"
  }
}
```

---

## Idempotency

### POST /tasks Idempotency

**Required Headers:**
```http
POST /api/v1/tasks
Authorization: Bearer {token}
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

**Logic:**
- First request with key → Creates task + caches response
- Second request with same key → Returns cached response
- Different request body → Ignored, cached response returned
- Key expires after 24 hours

### Example: Idempotent Create

```http
# Request 1 - Creates task
POST /api/v1/tasks
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "title": "Task 1",
  "priority": "medium"
}

# Response 1: 201 Created
{
  "message": "Task created successfully",
  "task": { "id": 1, "title": "Task 1", ... }
}
```

```http
# Request 2 - Same key, different body
POST /api/v1/tasks
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "title": "Task 2",
  "priority": "high"
}

# Response 2: 201 Created (CACHED - returns Task 1)
{
  "message": "Task created successfully",
  "task": { "id": 1, "title": "Task 1", ... }
}
```

### PATCH Status (Naturally Idempotent)

```http
# Request 1
PATCH /api/v1/tasks/1/status
{ "status": "completed" }

# Response: 200 OK

---

# Request 2 - Same request
PATCH /api/v1/tasks/1/status
{ "status": "completed" }

# Response: 200 OK (idempotent - no error)
```

---

## Endpoints

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Logout user |

### User Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users` | ✅ | admin | Get all users |
| GET | `/users/:id` | ✅ | admin | Get user by ID |
| PUT | `/users/:id` | ✅ | admin | Update user |
| DELETE | `/users/:id` | ✅ | admin | Delete user |
| GET | `/users/me` | ✅ | - | Get own profile |
| PUT | `/users/me` | ✅ | - | Update own profile |
| DELETE | `/users/me` | ✅ | - | Delete own account |

### Task Endpoints

| Method | Endpoint | Auth | Headers | Description |
|--------|----------|------|---------|-------------|
| GET | `/tasks` | ✅ | - | Get all tasks |
| POST | `/tasks` | ✅ | Idempotency-Key | Create task |
| GET | `/tasks/:id` | ✅ | - | Get task by ID |
| PUT | `/tasks/:id` | ✅ | - | Update task |
| PATCH | `/tasks/:id/status` | ✅ | - | Update status |
| DELETE | `/tasks/:id` | ✅ | - | Delete task |

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {},
    "timestamp": "2025-11-11T10:30:45.123Z",
    "path": "/api/v1/endpoint"
  }
}
```

### Common Error Codes

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Missing required fields |
| 400 | MISSING_IDEMPOTENCY_KEY | Idempotency-Key required |
| 401 | UNAUTHORIZED | Invalid credentials |
| 403 | FORBIDDEN | No permission to access |
| 403 | PREMIUM_REQUIRED | Premium account required |
| 403 | SUBSCRIPTION_EXPIRED | Premium expired |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Email already exists |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |

---

## Examples

### Example 1: Complete User Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
# Save: accessToken, refreshToken

# 3. Get Profile
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer {accessToken}"

# 4. Create Task (with idempotency)
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {accessToken}" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Task",
    "priority": "medium",
    "status": "pending"
  }'

# 5. Update Task Status
curl -X PATCH http://localhost:3000/api/v1/tasks/1/status \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'

# 6. Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "{refreshToken}" }'
```

### Example 2: RBAC Testing

```bash
# User tries to access /users (should fail)
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer {userToken}"
# Response: 403 FORBIDDEN

# Admin accesses /users (should succeed)
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer {adminToken}"
# Response: 200 OK [users...]
```

### Example 3: ABAC Testing

```bash
# User tries to create HIGH priority task (should fail)
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {userToken}" \
  -H "Idempotency-Key: uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urgent Task",
    "priority": "high"
  }'
# Response: 403 PREMIUM_REQUIRED

# Premium user creates HIGH priority task (should succeed)
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {premiumToken}" \
  -H "Idempotency-Key: uuid-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Urgent Task",
    "priority": "high"
  }'
# Response: 201 Created
```

### Example 4: Rate Limiting Testing

```bash
# Send 101 requests as normal user in 15 minutes
# Request 101 should fail:

curl -X GET http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {userToken}"
# Response: 429 Too Many Requests
# Header: RateLimit-Remaining: 0, RateLimit-Reset: ...

# Check headers
curl -i -X GET http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {userToken}"
# Headers:
# RateLimit-Limit: 100
# RateLimit-Remaining: 87
# RateLimit-Reset: 1699123456
```

---

## Integration with Postman

### Import Collection

1. Download `postman_collection.json`
2. Open Postman
3. Click "Import" → Select file
4. Environment variables auto-setup:
   - `base_url`: http://localhost:3000/api/v1
   - `access_token`: (fill after login)
   - `refresh_token`: (fill after login)

### Import from OpenAPI

1. Open Postman
2. File → Import → Link
3. Paste: `https://your-domain/openapi.yaml`
4. Postman auto-generates collection

---

## Best Practices

### 1. Idempotency Keys
```javascript
// Generate UUID v4 for each POST request
const uuid = crypto.randomUUID();
// Or use Postman: {{$randomUUID}}
```

### 2. Token Management
```javascript
// Store tokens securely
localStorage.setItem('accessToken', token);
// Use in requests
headers.Authorization = `Bearer ${token}`;
```

### 3. Error Handling
```javascript
if (response.status === 429) {
  // Wait before retrying
  const retryAfter = response.body.error.retryAfter;
  setTimeout(() => retry(), retryAfter * 1000);
}
```

### 4. Refresh Tokens
```javascript
// When access token expires (401)
const newToken = await refreshToken(refreshToken);
// Retry original request with new token
```

---

## Support

For issues or questions:
- 📧 Email: support@minitaskapi.com
- 📚 Documentation: Full OpenAPI spec in `openapi.yaml`
- 📋 Postman: Import `postman_collection.json`

---

**Version:** 1.0.0  
**Last Updated:** November 11, 2025  
**Status:** ✅ Production Ready
