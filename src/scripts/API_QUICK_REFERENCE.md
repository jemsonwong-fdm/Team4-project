# API Quick Reference

## Authentication
```bash
# Login
POST /api/auth/login
Body: { "rmId": "rm-001" }

# Get current user
GET /api/auth/me

# Logout
POST /api/auth/logout
```

## Mock Data
```bash
# Load mock data
POST /api/mock-data/load
Body: { "clearExisting": true, "mode": "mock" }

# Get data mode
GET /api/mock-data/load
```

## Opportunities
```bash
# List opportunities
GET /api/opportunities
Query: ?clientName=Solar&ecosystemPosition=Project%20Developers&limit=10

# Get single opportunity
GET /api/opportunities/{id}

# Generate opportunities
POST /api/opportunities/generate
Body: { "minScore": 50, "concurrency": 5 }
```

## Invitations
```bash
# Send invitation
POST /api/invitations
Body: { "opportunityId": "..." }

# List invitations
GET /api/invitations
Query: ?type=received|sent|all

# Respond to invitation
PUT /api/invitations/{id}
Body: { "status": "accepted" | "declined" }
```

## Response Format
```json
{
  "success": true,
  "data": { ... },
  "count": 10
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error
