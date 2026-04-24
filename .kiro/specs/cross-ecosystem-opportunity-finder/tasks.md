# Implementation Plan: Cross-Ecosystem Opportunity Finder

## Overview

This implementation plan breaks down the Cross-Ecosystem Opportunity Finder into discrete coding tasks. The system will be built using Next.js 14+ with TypeScript, focusing on demonstrating the MVP concept using mock data and Azure OpenAI Foundry for LLM-based matching. Testing is skipped for this MVP to accelerate development.

## Tasks

- [x] 1. Set up project structure and core types
  - Create directory structure in src/ (lib/models, lib/services, lib/api)
  - Define core TypeScript interfaces and enums in src/lib/models (Client, Opportunity, Invitation, EcosystemPosition, BankingProduct)
  - Set up configuration for Azure OpenAI Foundry API in src/config
  - Add environment variables to .env.local (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT)
  - _Requirements: 1.1, 2.1_

- [x] 2. Implement data models and in-memory storage
  - [x] 2.1 Create data model classes with validation
    - Implement Client model with field validation in src/lib/models
    - Implement Opportunity model with constraints
    - Implement Invitation model with status tracking
    - Implement AuditLogEntry and LLMInteractionLog models
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.2 Implement in-memory data stores
    - Create in-memory stores in src/lib/data for clients, opportunities, invitations, and logs
    - Implement basic CRUD operations for each store
    - Add indexing for efficient lookups (by RM, by ID)
    - _Requirements: 1.1, 1.5_

- [x] 3. Implement ecosystem mapping service
  - [x] 3.1 Define ecosystem positions and relationships
    - Create enum for all 8 ecosystem positions in src/lib/models
    - Define banking products with descriptions in src/lib/data
    - Map banking products to ecosystem position pairs
    - _Requirements: 2.1, 2.4_
  
  - [x] 3.2 Implement ecosystem service methods
    - Create EcosystemService in src/lib/services
    - Implement getPositionRelationships() to return complementary positions
    - Implement getBankingProductsForPair() to return relevant products
    - Implement arePositionsComplementary() for position pair validation
    - _Requirements: 2.3, 2.4_

- [x] 4. Implement decoupled LLM integration
  - [x] 4.1 Create base LLM service with Azure OpenAI client
    - Create BaseLLMService in src/lib/services/llm/base.ts
    - Set up Azure OpenAI SDK with provided endpoints
    - Implement authentication with API key from environment variables
    - Create generic sendRequest() method for all LLM calls
    - Add error handling and retry logic (timeout 30s, 3 retries with exponential backoff)
    - Handle Azure-specific errors (401, 429, 500)
    - Log all LLM interactions to LLMInteractionLog
    - _Requirements: 3.1, 8.3_
  
  - [x] 4.2 Create specialized LLM request handlers
    - Create src/lib/services/llm/scoringService.ts for match scoring requests
    - Create src/lib/services/llm/summaryService.ts for opportunity summary generation
    - Create src/lib/services/llm/detailService.ts for detailed brief generation
    - Each service has specific prompt templates and response parsers
    - _Requirements: 3.1, 3.3_
  
  - [x] 4.3 Implement batch processing for LLM requests
    - Create src/lib/services/llm/batchProcessor.ts
    - Implement processBatch() to handle multiple client pairs efficiently
    - Add rate limiting and queue management
    - Support parallel processing with configurable concurrency
    - Return results as they complete (streaming results)
    - _Requirements: 3.1_

- [x] 5. Checkpoint - Verify LLM integration works
  - Ensure Azure OpenAI connection is successful
  - Manually test match scoring with sample client pairs
  - Verify error handling and logging
  - Ask the user if questions arise

- [x] 6. Implement client management service
  - [x] 6.1 Create ClientService with CRUD operations
    - Create ClientService in src/lib/services
    - Implement createClient() with validation
    - Implement updateClient() with RM authorization check
    - Implement getClientsByRM() for RM-specific queries
    - Implement getClientById() and getAllClients()
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 6.2 Implement access control and data redaction
    - Create AccessControlService in src/lib/services
    - Create canAccessClient() and canModifyClient() authorization checks
    - Implement redactClientForCrossRMView() to hide sensitive fields
    - Add audit logging for all client data access
    - _Requirements: 1.4, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Implement opportunity detection service
  - [x] 7.1 Create opportunity candidate generation
    - Create OpportunityDetectionService in src/lib/services
    - Implement generateCandidatePairs() to create all cross-RM client pairs
    - Filter pairs to only include different RMs
    - Prioritize pairs with complementary ecosystem positions
    - _Requirements: 3.4, 3.5_
  
  - [x] 7.2 Implement opportunity evaluation with batch LLM processing
    - Create evaluatePair() that calls LLM scoringService
    - Implement detectOpportunities() to process all candidate pairs using batchProcessor
    - Use batch processing for efficient LLM calls (process multiple pairs in parallel)
    - Filter opportunities by minimum score threshold
    - Flag low-confidence opportunities for review
    - _Requirements: 3.1, 3.2, 3.3, 8.5_
  
  - [x] 7.3 Implement opportunity brief generation
    - Create OpportunityBriefService in src/lib/services
    - Use LLM summaryService for brief titles
    - Use LLM detailService for detailed explanations
    - Generate descriptive titles based on client names and positions
    - Format trigger explanations from LLM reasoning
    - Include suggested banking products from ecosystem mapping
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Implement RM collaboration service
  - [x] 8.1 Create invitation management
    - Create CollaborationService in src/lib/services
    - Implement sendInvitation() with duplicate checking
    - Implement getInvitationsForRM() to retrieve invitations
    - Implement respondToInvitation() to update status
    - Record sender and timestamp for all invitations
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 8.2 Add invitation-opportunity association
    - Ensure invitations include full opportunity brief data
    - Implement retrieval of opportunity details with invitations
    - _Requirements: 6.5_

- [ ] 9. Checkpoint - Verify core services work together
  - Test creating clients, generating opportunities, and sending invitations
  - Verify access control prevents unauthorized access
  - Check audit logging is working
  - Ask the user if questions arise

- [x] 10. Create mock data as JSON files
  - [x] 10.1 Create JSON mock data files
    - Create src/data/mock/rms.json with 3-5 mock RMs (id, name, segment)
    - Create src/data/mock/clients.json with ~10 clients per RM
    - Include realistic company names for clean power ecosystem
    - Distribute clients across all 8 ecosystem positions
    - Include diverse geographies (North America, Europe, Asia, etc.)
    - Add realistic revenue ranges and ESG alignment descriptions
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 10.2 Create data loader utility
    - Create src/lib/data/mockDataLoader.ts to read JSON files
    - Implement loadMockData() function to populate stores from JSON
    - Add mode indicator (mock vs production)
    - Add ability to switch between mock and production modes
    - _Requirements: 9.4, 9.5_

- [ ] 11. Implement opportunity discovery and filtering
  - [ ] 11.1 Create opportunity query service
    - Add to OpportunityDetectionService in src/lib/services
    - Implement getOpportunitiesForRM() to filter by RM's clients
    - Add search/filter by client name, ecosystem position, or RM
    - Implement default sorting by match score (descending)
    - _Requirements: 5.2, 5.3, 5.5_
  
  - [ ] 11.2 Implement opportunity display formatting
    - Add to OpportunityBriefService
    - Create formatOpportunityForDisplay() with all required fields
    - Include client names, ecosystem positions, match scores, RM identifiers
    - Apply data redaction for cross-RM viewing
    - _Requirements: 5.1, 5.4_

- [x] 12. Build Next.js API routes
  - [x] 12.1 Set up authentication utilities
    - Create authentication helper in src/lib/auth.ts
    - Implement simple RM authentication (session-based for MVP)
    - Create middleware to extract RM identity from requests
    - _Requirements: 7.1_
  
  - [x] 12.2 Create opportunity API routes
    - Create src/app/api/opportunities/route.ts for GET (list with filters)
    - Create src/app/api/opportunities/[id]/route.ts for GET (single)
    - Create src/app/api/opportunities/generate/route.ts for POST (trigger detection)
    - Add authentication checks
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 12.3 Create invitation API routes
    - Create src/app/api/invitations/route.ts for POST (send) and GET (list)
    - Create src/app/api/invitations/[id]/route.ts for PUT (respond)
    - Add authentication checks
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [x] 12.4 Create utility API routes
    - Create src/app/api/mock-data/load/route.ts for POST
    - _Requirements: 9.1, 9.4_

- [x] 13. Checkpoint - Test API routes
  - Use Postman or curl to test all API routes
  - Verify authentication and authorization
  - Test opportunity generation with mock data
  - Ask the user if questions arise

- [x] 14. Build simplified pages and components
  - [x] 14.1 Update dashboard as main page
    - Update src/app/(main)/dashboard/page.tsx as main landing page
    - Show overview stats (total opportunities, pending invitations)
    - Add quick action buttons (Generate Opportunities, View All)
    - Display top 5 opportunities by match score
    - _Requirements: 5.1_
  
  - [x] 14.2 Build opportunities page
    - Create src/app/(main)/opportunities/page.tsx
    - Create src/components/opportunity-table.tsx for table view
    - Display client names, ecosystem positions, match scores, RMs
    - Add simple search/filter controls
    - Implement sorting by match score
    - Click row to view details in modal or side panel
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 14.3 Build opportunity detail modal/panel
    - Create src/components/opportunity-detail.tsx
    - Show all fields: title, players, trigger, banking products, score, reasoning
    - Add "Send Invitation" button for the other RM
    - Display confidence level and review flag if applicable
    - _Requirements: 4.1, 5.4, 6.1_
  
  - [x] 14.4 Build invitations page
    - Create src/app/(main)/invitations/page.tsx
    - Create src/components/invitation-card.tsx
    - Display received invitations with opportunity briefs
    - Add accept/decline buttons for invitations
    - Show invitation status and timestamps
    - _Requirements: 6.2, 6.5_

- [x] 15. Create API client utilities and connect pages
  - [x] 15.1 Create API client helpers
    - Create src/lib/api/client.ts with typed fetch wrappers
    - Create typed API client methods for all endpoints
    - Add error handling and loading states using existing UI components (sonner for toasts)
    - _Requirements: All_
  
  - [x] 15.2 Connect pages to API routes
    - Wire dashboard to GET /api/opportunities (top 5)
    - Wire opportunities page to GET /api/opportunities
    - Connect opportunity detail to GET /api/opportunities/[id]
    - Wire invitation sending to POST /api/invitations
    - Connect invitations page to GET /api/invitations
    - _Requirements: All_

- [x] 16. Add opportunity generation workflow
  - [x] 16.1 Add generation button to dashboard
    - Add "Generate Opportunities" button to dashboard
    - Trigger opportunity detection via POST /api/opportunities/generate
    - Show progress indicator during LLM processing using existing UI
    - Display toast notification with summary of generated opportunities
    - _Requirements: 3.1, 3.2_

- [x] 17. Final integration and polish
  - [x] 17.1 Load mock data on startup
    - Automatically load mock data when app initializes
    - Add indicator in dashboard showing "Mock Data Mode"
    - _Requirements: 9.1, 9.4_
  
  - [x] 17.2 Add error handling and user feedback
    - Use existing sonner toast for success/error messages
    - Add loading spinners for async operations
    - Ensure all actions provide user feedback
    - _Requirements: All_
  
  - [x] 17.3 Polish UI with existing components
    - Use existing shadcn/ui components for consistency
    - Add lucide-react icons for ecosystem positions
    - Ensure responsive design works on mobile
    - Add simple navigation in sidebar for 3 pages (Dashboard, Opportunities, Invitations)
    - _Requirements: 5.1_

- [ ] 18. Final checkpoint - End-to-end testing
  - Test complete flow: Dashboard → Generate Opportunities → Browse → View Details → Send Invitation → Check Invitations
  - Verify all ecosystem positions are represented
  - Check that LLM-generated briefs are reasonable
  - Verify mock data loads correctly
  - Ask the user if questions arise

## Notes

- This is an MVP focused on demonstrating the concept
- Built with Next.js 14+ (App Router) and TypeScript
- Testing is skipped to accelerate development
- Mock data stored as JSON files for easy editing
- LLM integration is decoupled into specialized services (scoring, summary, detail)
- Batch processing for efficient LLM API usage
- Azure OpenAI Foundry is used for LLM integration
- In-memory storage is sufficient for MVP (no database required)
- Tailwind CSS for styling with existing shadcn/ui components
- Focus on core functionality over polish
- Each task builds incrementally on previous tasks
