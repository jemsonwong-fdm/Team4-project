# End-to-End Testing Checklist
## Cross-Ecosystem Opportunity Finder - Task 18

This document provides a comprehensive manual testing checklist for the complete application flow.

## Prerequisites
- Development server running on http://localhost:3000
- Mock data should be loaded automatically on first page load

## Test Flow

### 1. Login Flow ✓
**URL:** http://localhost:3000/login

**Steps:**
1. Navigate to http://localhost:3000
2. Should redirect to /dashboard
3. If not authenticated, should show "Authentication Required" with "Log In" button
4. Click "Log In" button → redirects to /login page
5. Select an RM from dropdown (e.g., "Sarah Chen - Project Developers")
6. Click "Log In" button
7. Should show success toast and redirect to /dashboard

**Expected Results:**
- Login page displays with 4 RM options
- Successful login redirects to dashboard
- Session cookie is set (rm_session)

---

### 2. Dashboard Overview ✓
**URL:** http://localhost:3000/dashboard

**Steps:**
1. After login, verify dashboard displays
2. Check header shows: "Welcome back, [RM Name] ([Segment])"
3. Verify "Mock Data Mode" badge is visible
4. Check stats cards display:
   - Total Opportunities (initially 0)
   - Pending Invitations (initially 0)
   - High-Value Matches (initially 0)
5. Verify Quick Actions section with two buttons:
   - "Generate Opportunities"
   - "View All Opportunities"
6. Check "Top Opportunities" section shows "No opportunities found" message

**Expected Results:**
- Dashboard loads successfully
- All UI components render correctly
- Stats show 0 initially (no opportunities generated yet)
- Mock data indicator is visible

---

### 3. Mock Data Verification ✓
**Check in Browser Console or Network Tab:**

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for mock data initialization logs:
   - "[Mock Data] Initializing mock data on startup..."
   - "[Mock Data] Loaded X clients and Y RMs"

**Expected Results:**
- Mock data loads automatically
- Should see: "Loaded 40 clients and 4 RMs"
- No errors in console

**Verify Ecosystem Positions:**
Check that clients cover all 8 positions:
- Project Developers
- EPC Contractors
- Technology & Equipment Suppliers
- Storage Suppliers
- Grid & Transmission Operators
- Project Sponsors & Investors
- Energy Off-takers
- Research, Innovation & Early-stage Companies

---

### 4. Generate Opportunities ✓
**URL:** http://localhost:3000/dashboard

**Steps:**
1. Click "Generate Opportunities" button
2. Button should show "Generating..." with spinner
3. Wait for LLM processing (30-60 seconds)
4. Watch for success toast notification
5. Stats cards should update with new counts
6. "Top Opportunities" section should populate with opportunities

**Expected Results:**
- Generation process completes successfully
- Toast shows: "Opportunities generated - Generated X opportunities from 40 clients"
- Dashboard stats update automatically
- Top 5 opportunities display with:
  - Opportunity title
  - Client names
  - Ecosystem position badges with icons
  - Match score (0-100)
  - Confidence level (high/medium/low)

**Note:** This step makes real LLM API calls and may take time. Check:
- Network tab shows POST to /api/opportunities/generate
- Console shows progress logs
- No timeout errors

---

### 5. Browse Opportunities ✓
**URL:** http://localhost:3000/opportunities

**Steps:**
1. Click "View All Opportunities" button from dashboard
2. Verify opportunities page loads
3. Check table displays all generated opportunities
4. Verify each row shows:
   - Client 1 name and ecosystem position
   - Client 2 name and ecosystem position
   - Match score
   - Confidence badge
   - Both RM names
5. Test sorting (should be by match score descending by default)
6. Test search/filter functionality:
   - Search by client name
   - Filter by ecosystem position
   - Filter by RM

**Expected Results:**
- All opportunities display in table format
- Highest match scores appear first
- Search and filters work correctly
- Only opportunities involving current RM's clients are shown
- Cross-RM client data is redacted (only name and position visible)

---

### 6. View Opportunity Details ✓
**URL:** http://localhost:3000/opportunities (with modal/panel)

**Steps:**
1. From opportunities page, click on any opportunity row
2. Verify detail modal/panel opens
3. Check all fields are present:
   - **Title:** Descriptive opportunity title
   - **Players:** Both client names with ecosystem positions
   - **Trigger:** Explanation of why this opportunity exists
   - **Banking Products:** List of suggested products (e.g., Project Finance, Working Capital)
   - **Match Score:** Numerical score (0-100)
   - **Confidence:** High/Medium/Low badge
   - **Reasoning:** LLM-generated explanation
   - **Review Flag:** If flagged for review
4. Verify "Send Invitation" button is present
5. Check that own client shows full details
6. Check that other RM's client shows limited details (redacted)

**Expected Results:**
- Detail view shows complete opportunity brief
- All required fields are populated
- LLM-generated content is reasonable and relevant
- Banking products match the ecosystem position pair
- UI is responsive and readable

---

### 7. Send Invitation ✓
**URL:** http://localhost:3000/opportunities (detail view)

**Steps:**
1. From opportunity detail view, click "Send Invitation" button
2. Verify confirmation or immediate action
3. Check for success toast notification
4. Button should disable or change state after sending
5. Try sending duplicate invitation (should fail)

**Expected Results:**
- Invitation sends successfully
- Toast shows: "Invitation sent - The other RM has been notified"
- Cannot send duplicate invitation for same opportunity
- Error toast if duplicate: "Invitation already exists"

---

### 8. Check Invitations ✓
**URL:** http://localhost:3000/invitations

**Steps:**
1. Navigate to Invitations page (from sidebar)
2. Verify page displays sent and received invitations
3. Check invitation cards show:
   - Opportunity title
   - Client names
   - Sender/Recipient RM names
   - Status (pending/accepted/declined)
   - Timestamp
   - Associated opportunity brief
4. For received invitations, verify Accept/Decline buttons
5. Test accepting an invitation:
   - Click "Accept" button
   - Verify success toast
   - Status updates to "accepted"
6. Test declining an invitation:
   - Click "Decline" button
   - Verify success toast
   - Status updates to "declined"

**Expected Results:**
- Invitations page displays correctly
- Sent invitations show in "Sent" tab
- Received invitations show in "Received" tab
- Accept/Decline actions work correctly
- Status updates immediately
- Toast notifications appear for all actions

---

### 9. Complete Flow Test ✓
**Full End-to-End Journey:**

1. **Start:** Login as RM 1 (Sarah Chen)
2. **Dashboard:** View initial state (0 opportunities)
3. **Generate:** Click "Generate Opportunities" and wait
4. **Browse:** View generated opportunities list
5. **Detail:** Click on high-score opportunity to view details
6. **Invite:** Send invitation to other RM
7. **Logout:** Clear session (or use incognito)
8. **Login:** Login as RM 2 (the recipient)
9. **Invitations:** Check received invitations
10. **Accept:** Accept the invitation
11. **Verify:** Check that both RMs can see the opportunity

**Expected Results:**
- Complete flow works without errors
- Data persists across actions
- Cross-RM collaboration works correctly
- All UI feedback is appropriate

---

## Verification Checklist

### Data Integrity ✓
- [ ] All 40 mock clients loaded
- [ ] All 4 RMs available
- [ ] All 8 ecosystem positions represented
- [ ] Client data includes realistic values (revenue, geography, ESG)

### LLM Integration ✓
- [ ] Match scores are reasonable (0-100)
- [ ] Reasoning is coherent and relevant
- [ ] Banking products match ecosystem positions
- [ ] Confidence levels are appropriate
- [ ] No timeout errors during generation

### Access Control ✓
- [ ] RMs can only see opportunities involving their clients
- [ ] Cross-RM client data is redacted properly
- [ ] RMs cannot modify other RMs' clients
- [ ] Authentication is required for all protected routes

### UI/UX ✓
- [ ] All pages are responsive (mobile, tablet, desktop)
- [ ] Loading states show during async operations
- [ ] Error messages are clear and helpful
- [ ] Success toasts appear for all actions
- [ ] Navigation works correctly
- [ ] Icons display for ecosystem positions
- [ ] Badges show confidence levels
- [ ] Mock Data Mode indicator is visible

### Performance ✓
- [ ] Dashboard loads quickly
- [ ] Opportunity generation completes within reasonable time
- [ ] No memory leaks or console errors
- [ ] Batch processing works efficiently

---

## Known Issues / Questions

### Issues to Report:
1. **Authentication:** Note any authentication issues
2. **LLM Timeouts:** Note if opportunity generation times out
3. **Data Redaction:** Verify cross-RM data is properly hidden
4. **UI Bugs:** Note any visual or interaction issues

### Questions for User:
1. Are the LLM-generated opportunity briefs reasonable and useful?
2. Are all ecosystem positions well-represented in the opportunities?
3. Is the match scoring making sense?
4. Are the suggested banking products appropriate?
5. Is the UI intuitive and easy to use?

---

## Test Results Summary

**Date:** _________________
**Tester:** _________________
**Environment:** http://localhost:3000

| Test Section | Status | Notes |
|-------------|--------|-------|
| 1. Login Flow | ⬜ Pass / ⬜ Fail | |
| 2. Dashboard Overview | ⬜ Pass / ⬜ Fail | |
| 3. Mock Data Verification | ⬜ Pass / ⬜ Fail | |
| 4. Generate Opportunities | ⬜ Pass / ⬜ Fail | |
| 5. Browse Opportunities | ⬜ Pass / ⬜ Fail | |
| 6. View Opportunity Details | ⬜ Pass / ⬜ Fail | |
| 7. Send Invitation | ⬜ Pass / ⬜ Fail | |
| 8. Check Invitations | ⬜ Pass / ⬜ Fail | |
| 9. Complete Flow Test | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ Pass / ⬜ Fail

**Additional Comments:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
