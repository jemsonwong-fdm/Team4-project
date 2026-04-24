# API Routes Testing Guide

This document provides examples for testing the implemented API routes.

## Prerequisites

1. Start the Next.js development server:
```bash
npm run dev
```

2. Set up authentication by logging in as an RM (you'll need to implement a login endpoint or manually set the cookie)

## Authentication

The API uses cookie-based authentication with the `rm_session` cookie containing the RM ID.

### Auth Endpoints

**GET** `/api/auth/login`

Get all available RMs for login.

```bash
curl http://localhost:3000/api/auth/login
```

**POST** `/api/auth/login`

Login as an RM.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rmId": "rm-001"}' \
  -c cookies.txt
```

**GET** `/api/auth/me`

Get current authenticated RM.

```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

**POST** `/api/auth/logout`

Logout the current RM.

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## API Endpoints

### 1. Load Mock Data

**POST** `/api/mock-data/load`

Load mock data into the system.

```bash
curl -X POST http://localhost:3000/api/mock-data/load \
  -H "Content-Type: application/json" \
  -H "Cookie: rm_session=rm-001" \
  -d '{"clearExisting": true, "mode": "mock"}'
```

**GET** `/api/mock-data/load`

Get current data mode.

```bash
curl http://localhost:3000/api/mock-data/load \
  -H "Cookie: rm_session=rm-001"
```

### 2. Opportunities

**GET** `/api/opportunities`

List opportunities with optional filters.

```bash
# Get all opportunities for the authenticated RM
curl http://localhost:3000/api/opportunities \
  -H "Cookie: rm_session=rm-001"

# Filter by client name
curl "http://localhost:3000/api/opportunities?clientName=Solar" \
  -H "Cookie: rm_session=rm-001"

# Filter by ecosystem position
curl "http://localhost:3000/api/opportunities?ecosystemPosition=Project%20Developers" \
  -H "Cookie: rm_session=rm-001"

# Limit results
curl "http://localhost:3000/api/opportunities?limit=5" \
  -H "Cookie: rm_session=rm-001"
```

**GET** `/api/opportunities/[id]`

Get a single opportunity by ID.

```bash
curl http://localhost:3000/api/opportunities/[opportunity-id] \
  -H "Cookie: rm_session=rm-001"
```

**POST** `/api/opportunities/generate`

Generate opportunities from client data.

```bash
curl -X POST http://localhost:3000/api/opportunities/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: rm_session=rm-001" \
  -d '{"minScore": 50, "concurrency": 5}'
```

### 3. Invitations

**POST** `/api/invitations`

Send an invitation to another RM.

```bash
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: rm_session=rm-001" \
  -d '{"opportunityId": "[opportunity-id]"}'
```

**GET** `/api/invitations`

List invitations for the authenticated RM.

```bash
# Get all invitations (sent and received)
curl http://localhost:3000/api/invitations \
  -H "Cookie: rm_session=rm-001"

# Get only received invitations
curl "http://localhost:3000/api/invitations?type=received" \
  -H "Cookie: rm_session=rm-001"

# Get only sent invitations
curl "http://localhost:3000/api/invitations?type=sent" \
  -H "Cookie: rm_session=rm-001"
```

**PUT** `/api/invitations/[id]`

Respond to an invitation (accept or decline).

```bash
# Accept invitation
curl -X PUT http://localhost:3000/api/invitations/[invitation-id] \
  -H "Content-Type: application/json" \
  -H "Cookie: rm_session=rm-001" \
  -d '{"status": "accepted"}'

# Decline invitation
curl -X PUT http://localhost:3000/api/invitations/[invitation-id] \
  -H "Content-Type: application/json" \
  -H "Cookie: rm_session=rm-001" \
  -d '{"status": "declined"}'
```

## Testing Flow

1. **Login as an RM**:
   ```bash
   POST /api/auth/login
   ```

2. **Load mock data**:
   ```bash
   POST /api/mock-data/load
   ```

3. **Generate opportunities**:
   ```bash
   POST /api/opportunities/generate
   ```

4. **Browse opportunities**:
   ```bash
   GET /api/opportunities
   ```

5. **View opportunity details**:
   ```bash
   GET /api/opportunities/[id]
   ```

6. **Send invitation**:
   ```bash
   POST /api/invitations
   ```

7. **Check invitations** (as recipient RM):
   ```bash
   GET /api/invitations?type=received
   ```

8. **Respond to invitation**:
   ```bash
   PUT /api/invitations/[id]
   ```

9. **Logout**:
   ```bash
   POST /api/auth/logout
   ```

## Response Formats

All successful responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "count": 10  // For list endpoints
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., duplicate invitation)
- `500 Internal Server Error` - Server error

## Notes

- All endpoints require authentication via the `rm_session` cookie
- Client data is automatically redacted for cross-RM viewing
- Opportunities are sorted by match score (descending) by default
- Invitations include full opportunity brief data
- Audit logs are automatically created for all actions
