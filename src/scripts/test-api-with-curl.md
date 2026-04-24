# API Routes Testing Guide
## Task 13: Checkpoint - Test API routes

This guide provides curl commands to test all API routes. Run these commands after starting the Next.js development server.

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. The server should be running on `http://localhost:3000`

## Test Sequence

### 1. Authentication Routes

#### Get all available RMs
```bash
curl -X GET http://localhost:3000/api/auth/login
```

Expected: List of RMs with their IDs, names, and segments

#### Login as an RM (get session cookie)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"rmId\": \"rm-001\"}" \
  -c cookies.txt
```

Expected: Success response with RM details. The `-c cookies.txt` saves the session cookie.

#### Test invalid login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"rmId\": \"invalid-id\"}"
```

Expected: 401 error with "Invalid RM ID"

---

### 2. Mock Data Routes

#### Load mock data (requires authentication)
```bash
curl -X POST http://localhost:3000/api/mock-data/load \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"clearExisting\": true, \"mode\": \"mock\"}"
```

Expected: Success response with counts of RMs and clients loaded

#### Get current data mode
```bash
curl -X GET http://localhost:3000/api/mock-data/load \
  -b cookies.txt
```

Expected: Current data mode (should be "mock")

#### Test without authentication
```bash
curl -X POST http://localhost:3000/api/mock-data/load \
  -H "Content-Type: application/json" \
  -d "{}"
```

Expected: 401 error "Authentication required"

---

### 3. Opportunity Generation Route

#### Generate opportunities (requires authentication)
```bash
curl -X POST http://localhost:3000/api/opportunities/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"minScore\": 50, \"concurrency\": 3}"
```

Expected: Success response with count of opportunities generated. This may take 30-60 seconds due to LLM processing.

**Note:** This is the most important test as it validates:
- LLM integration works
- Batch processing works
- Opportunity detection logic works
- Brief generation works

---

### 4. Opportunity Listing Routes

#### List all opportunities for authenticated RM
```bash
curl -X GET http://localhost:3000/api/opportunities \
  -b cookies.txt
```

Expected: Array of opportunities involving the authenticated RM's clients

#### List top 5 opportunities
```bash
curl -X GET "http://localhost:3000/api/opportunities?limit=5" \
  -b cookies.txt
```

Expected: Array of top 5 opportunities sorted by match score

#### Filter by client name
```bash
curl -X GET "http://localhost:3000/api/opportunities?clientName=Solar" \
  -b cookies.txt
```

Expected: Opportunities involving clients with "Solar" in their name

#### Filter by ecosystem position
```bash
curl -X GET "http://localhost:3000/api/opportunities?ecosystemPosition=Project%20Developers" \
  -b cookies.txt
```

Expected: Opportunities involving clients in the "Project Developers" position

#### Test without authentication
```bash
curl -X GET http://localhost:3000/api/opportunities
```

Expected: 401 error "Authentication required"

---

### 5. Opportunity Detail Route

First, get an opportunity ID from the list endpoint, then:

#### Get single opportunity
```bash
curl -X GET http://localhost:3000/api/opportunities/[OPPORTUNITY_ID] \
  -b cookies.txt
```

Replace `[OPPORTUNITY_ID]` with an actual opportunity ID from the list.

Expected: Full opportunity details with data redaction applied for cross-RM clients

#### Test accessing opportunity not involving current RM
Login as a different RM first, then try to access an opportunity that doesn't involve them.

Expected: 403 error "Access denied"

---

### 6. Invitation Routes

#### Send an invitation
```bash
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"opportunityId\": \"[OPPORTUNITY_ID]\"}"
```

Replace `[OPPORTUNITY_ID]` with an actual opportunity ID.

Expected: 201 Created with invitation details

#### Test duplicate invitation
Run the same command again:

Expected: 409 Conflict error about duplicate invitation

#### List all invitations
```bash
curl -X GET http://localhost:3000/api/invitations \
  -b cookies.txt
```

Expected: Array of all invitations (sent and received) for the authenticated RM

#### List received invitations only
```bash
curl -X GET "http://localhost:3000/api/invitations?type=received" \
  -b cookies.txt
```

Expected: Array of invitations received by the authenticated RM

#### List sent invitations only
```bash
curl -X GET "http://localhost:3000/api/invitations?type=sent" \
  -b cookies.txt
```

Expected: Array of invitations sent by the authenticated RM

#### Test without authentication
```bash
curl -X GET http://localhost:3000/api/invitations
```

Expected: 401 error "Authentication required"

---

## Verification Checklist

After running all tests, verify:

- [ ] Authentication works (login successful, invalid credentials rejected)
- [ ] Mock data loads successfully
- [ ] Opportunities can be generated (LLM integration works)
- [ ] Opportunities can be listed and filtered
- [ ] Single opportunity can be retrieved
- [ ] Data redaction works for cross-RM viewing
- [ ] Authorization prevents unauthorized access
- [ ] Invitations can be sent
- [ ] Duplicate invitations are prevented
- [ ] Invitations can be listed and filtered
- [ ] All routes require authentication (401 errors when not authenticated)

## Testing with Different RMs

To test cross-RM scenarios:

1. Login as RM 1 (rm-001):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"rmId\": \"rm-001\"}" \
  -c cookies-rm1.txt
```

2. Login as RM 2 (rm-002):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"rmId\": \"rm-002\"}" \
  -c cookies-rm2.txt
```

3. Use `-b cookies-rm1.txt` or `-b cookies-rm2.txt` to test as different RMs

## Notes

- All POST/PUT requests require `Content-Type: application/json` header
- Authentication is cookie-based, use `-b cookies.txt` to include session
- Opportunity generation may take 30-60 seconds due to LLM API calls
- Some tests require data from previous tests (e.g., opportunity IDs)
- Check the server console for detailed logs during testing
