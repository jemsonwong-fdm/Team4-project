# Design Document: Cross-Ecosystem Opportunity Finder

## Overview

The Cross-Ecosystem Opportunity Finder is an LLM-powered matching system that identifies high-value cross-segment opportunities in clean power banking. The system analyzes client portfolios across multiple RMs, maps clients to ecosystem positions, and generates actionable opportunity briefs that suggest specific banking products for cross-segment pairings.

The MVP focuses on demonstrating the concept using mock data and LLM-based matching rather than complex mathematical algorithms. The system prioritizes explainability and auditability to meet compliance requirements while enabling RMs to discover opportunities they would otherwise miss due to segment specialization.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Frontend (React Pages)                   │  │
│  │  (Opportunity Browser, Search, RM Collaboration UI)  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              API Routes (Backend)                     │  │
│  │  /api/clients, /api/opportunities, /api/invitations  │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Client     │  │  Opportunity │  │     RM       │     │
│  │  Management  │  │   Detection  │  │ Collaboration│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                    LLM Integration Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Matching   │  │    Scoring   │  │    Brief     │     │
│  │   Engine     │  │    Engine    │  │  Generation  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Clients    │  │ Opportunities│  │  Audit Log   │     │
│  │   Database   │  │   Database   │  │   Database   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Client Data Ingestion**: RMs input client data (or system loads mock data) via Next.js API routes
2. **Ecosystem Mapping**: System maps clients to ecosystem positions
3. **Opportunity Detection**: LLM analyzes all cross-RM client pairs for compatibility
4. **Scoring & Prioritization**: LLM generates match scores with reasoning
5. **Brief Generation**: System creates structured opportunity briefs with banking product suggestions
6. **RM Discovery**: RMs browse, search, and act on opportunities via Next.js pages
7. **Collaboration**: RMs send invitations to other RMs to facilitate introductions

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM Integration**: Azure OpenAI Foundry
- **Data Storage**: In-memory (for MVP)
- **Authentication**: Simple API key/session-based (for MVP)

## Components and Interfaces

### Client Management Component

**Responsibilities:**
- Store and retrieve client data
- Validate client attributes
- Associate clients with RMs
- Enforce access control (RMs can only modify their own clients)

**Interfaces:**

```typescript
interface Client {
  id: string;
  companyName: string;
  ecosystemPositions: EcosystemPosition[];
  geography: string;
  revenue: number;
  esgAlignment: string;
  rmId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientService {
  createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>, requestingRmId: string): Promise<Client>;
  getClientsByRM(rmId: string): Promise<Client[]>;
  getClientById(id: string): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  validateClientData(client: Partial<Client>): ValidationResult;
}
```

### Ecosystem Mapping Component

**Responsibilities:**
- Define ecosystem positions and their relationships
- Map banking products to position pairs
- Identify complementary segments

**Interfaces:**

```typescript
enum EcosystemPosition {
  PROJECT_DEVELOPERS = "Project Developers",
  EPC_CONTRACTORS = "EPC Contractors",
  TECHNOLOGY_SUPPLIERS = "Technology & Equipment Suppliers",
  STORAGE_SUPPLIERS = "Storage Suppliers",
  GRID_OPERATORS = "Grid & Transmission Operators",
  PROJECT_SPONSORS = "Project Sponsors & Investors",
  ENERGY_OFFTAKERS = "Energy Off-takers",
  RESEARCH_INNOVATION = "Research, Innovation & Early-stage Companies"
}

interface BankingProduct {
  name: string;
  description: string;
  applicablePositionPairs: [EcosystemPosition, EcosystemPosition][];
}

interface EcosystemService {
  getPositionRelationships(position: EcosystemPosition): EcosystemPosition[];
  getBankingProductsForPair(pos1: EcosystemPosition, pos2: EcosystemPosition): BankingProduct[];
  arePositionsComplementary(pos1: EcosystemPosition, pos2: EcosystemPosition): boolean;
}
```

### Opportunity Detection Component

**Responsibilities:**
- Generate client pairs across different RMs
- Use LLM to evaluate pair compatibility
- Filter for high-value opportunities
- Generate match scores and reasoning

**Interfaces:**

```typescript
interface OpportunityCandidate {
  client1: Client;
  client2: Client;
  ecosystemPositionPair: [EcosystemPosition, EcosystemPosition];
}

interface MatchResult {
  score: number; // 0-100
  reasoning: string;
  suggestedBankingProducts: BankingProduct[];
  confidence: 'high' | 'medium' | 'low';
}

interface OpportunityDetectionService {
  generateCandidatePairs(clients: Client[]): OpportunityCandidate[];
  evaluatePair(candidate: OpportunityCandidate): Promise<MatchResult>;
  detectOpportunities(clients: Client[], minScore: number): Promise<Opportunity[]>;
}
```

### LLM Integration Component (Decoupled Architecture)

**Responsibilities:**
- Interface with Azure OpenAI Foundry API
- Provide specialized request handlers for different use cases
- Support batch processing for efficiency
- Parse LLM responses
- Log all LLM interactions for auditability

**API Configuration:**
- Base URL: `https://klaudio-eastus2-resource.openai.azure.com/openai/v1`
- Projects API: `https://klaudio-eastus2-resource.services.ai.azure.com/api/projects/klaudio-eastus2`
- Authentication: Azure API key
- Model: GPT-4 or GPT-3.5-turbo (configurable)

**Interfaces:**

```typescript
interface LLMPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
  timestamp: Date;
}

interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  projectsEndpoint: string;
  model: string;
  apiVersion: string;
}

// Base LLM Service
interface BaseLLMService {
  sendRequest(prompt: LLMPrompt): Promise<LLMResponse>;
  logInteraction(prompt: LLMPrompt, response: LLMResponse): Promise<void>;
  configure(config: AzureOpenAIConfig): void;
}

// Specialized Services
interface ScoringService {
  scoreMatch(client1: Client, client2: Client, ecosystemContext: string): Promise<MatchResult>;
}

interface SummaryService {
  generateSummary(opportunity: Opportunity): Promise<string>;
}

interface DetailService {
  generateDetailedBrief(opportunity: Opportunity): Promise<string>;
}

// Batch Processing
interface BatchProcessor {
  processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: { concurrency: number; onProgress?: (completed: number, total: number) => void }
  ): Promise<R[]>;
}
```

### Mock Data Structure

**JSON Files:**
- `src/data/mock/rms.json` - Relationship Manager data
- `src/data/mock/clients.json` - Client company data

**Example Structure:**

```json
// rms.json
[
  {
    "id": "rm-001",
    "name": "Sarah Chen",
    "segment": "Project Developers"
  }
]

// clients.json
[
  {
    "id": "client-001",
    "companyName": "SolarTech Solutions",
    "ecosystemPositions": ["Technology & Equipment Suppliers"],
    "geography": "North America",
    "revenue": 250000000,
    "esgAlignment": "Strong commitment to carbon neutrality by 2030",
    "rmId": "rm-001"
  }
]
```

### Opportunity Brief Generation Component

**Responsibilities:**
- Create structured opportunity briefs
- Format information for RM consumption
- Include all required fields (title, players, trigger, banking products, score, reasoning)

**Interfaces:**

```typescript
interface Opportunity {
  id: string;
  title: string;
  client1: Client;
  client2: Client;
  rm1Id: string;
  rm2Id: string;
  trigger: string;
  suggestedBankingProducts: BankingProduct[];
  matchScore: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: Date;
  flaggedForReview: boolean;
}

interface OpportunityBriefService {
  generateBrief(matchResult: MatchResult, client1: Client, client2: Client): Promise<Opportunity>;
  formatBriefForDisplay(opportunity: Opportunity, viewingRmId: string): string;
}
```

### RM Collaboration Component

**Responsibilities:**
- Handle RM-to-RM invitations
- Track invitation status
- Prevent duplicate invitations
- Notify RMs of new invitations

**Interfaces:**

```typescript
interface Invitation {
  id: string;
  opportunityId: string;
  senderRmId: string;
  recipientRmId: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: Date;
  respondedAt?: Date;
}

interface CollaborationService {
  sendInvitation(opportunityId: string, senderRmId: string): Promise<Invitation>;
  getInvitationsForRM(rmId: string): Promise<Invitation[]>;
  respondToInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<Invitation>;
  checkDuplicateInvitation(opportunityId: string, senderRmId: string): Promise<boolean>;
}
```

### Access Control Component

**Responsibilities:**
- Authenticate RMs
- Enforce data access policies
- Log all data access for audit
- Redact sensitive information for cross-RM viewing

**Interfaces:**

```typescript
interface AccessControlService {
  authenticateRM(credentials: Credentials): Promise<RM>;
  canAccessClient(rmId: string, clientId: string): Promise<boolean>;
  canModifyClient(rmId: string, clientId: string): Promise<boolean>;
  redactClientForCrossRMView(client: Client): Partial<Client>;
  logAccess(rmId: string, resourceType: string, resourceId: string, action: string): Promise<void>;
}
```

## Data Models

### Client Model

```typescript
interface Client {
  id: string;                          // Unique identifier
  companyName: string;                 // Company name
  ecosystemPositions: EcosystemPosition[]; // One or more positions
  geography: string;                   // Geographic region
  revenue: number;                     // Annual revenue
  esgAlignment: string;                // ESG alignment description
  rmId: string;                        // Managing RM identifier
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
}
```

**Constraints:**
- `companyName` must be non-empty
- `ecosystemPositions` must contain at least one position
- `revenue` must be non-negative
- `rmId` must reference a valid RM

### Opportunity Model

```typescript
interface Opportunity {
  id: string;                          // Unique identifier
  title: string;                       // Brief opportunity title
  client1: Client;                     // First client in pairing
  client2: Client;                     // Second client in pairing
  rm1Id: string;                       // RM managing client1
  rm2Id: string;                       // RM managing client2
  trigger: string;                     // Why this opportunity exists
  suggestedBankingProducts: BankingProduct[]; // Relevant banking products
  matchScore: number;                  // 0-100 compatibility score
  reasoning: string;                   // LLM explanation
  confidence: 'high' | 'medium' | 'low'; // LLM confidence level
  createdAt: Date;                     // Creation timestamp
  flaggedForReview: boolean;           // Requires human review
}
```

**Constraints:**
- `client1.rmId` must not equal `client2.rmId` (cross-RM requirement)
- `matchScore` must be between 0 and 100
- `title` must be non-empty
- `suggestedBankingProducts` should contain at least one product

### Invitation Model

```typescript
interface Invitation {
  id: string;                          // Unique identifier
  opportunityId: string;               // Associated opportunity
  senderRmId: string;                  // RM sending invitation
  recipientRmId: string;               // RM receiving invitation
  status: 'pending' | 'accepted' | 'declined'; // Invitation status
  sentAt: Date;                        // Send timestamp
  respondedAt?: Date;                  // Response timestamp (optional)
}
```

**Constraints:**
- `senderRmId` must not equal `recipientRmId`
- `opportunityId` must reference a valid opportunity
- `respondedAt` must be after `sentAt` when present
- Only one pending invitation per (opportunityId, senderRmId) pair

### Audit Log Model

```typescript
interface AuditLogEntry {
  id: string;                          // Unique identifier
  timestamp: Date;                     // Event timestamp
  rmId: string;                        // RM performing action
  action: string;                      // Action type
  resourceType: string;                // Resource being accessed
  resourceId: string;                  // Resource identifier
  details: Record<string, any>;        // Additional context
}
```

### LLM Interaction Log Model

```typescript
interface LLMInteractionLog {
  id: string;                          // Unique identifier
  timestamp: Date;                     // Interaction timestamp
  promptType: string;                  // Type of prompt (matching, brief generation)
  systemPrompt: string;                // System prompt used
  userPrompt: string;                  // User prompt used
  response: string;                    // LLM response
  model: string;                       // LLM model used
  tokensUsed: number;                  // Token count
  relatedOpportunityId?: string;       // Associated opportunity (optional)
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Client Data Round-Trip Persistence

*For any* valid client data, storing the client and then retrieving it should return equivalent data with all fields preserved.

**Validates: Requirements 1.1, 1.5**

### Property 2: Invalid Client Rejection

*For any* client data missing required fields (companyName, ecosystemPositions, geography, revenue, esgAlignment, rmId), the system should reject the creation and return a validation error.

**Validates: Requirements 1.2**

### Property 3: Client-RM Association Invariant

*For any* client in the system, the client must have exactly one non-empty rmId field.

**Validates: Requirements 1.3**

### Property 4: Cross-RM Data Redaction

*For any* client and any RM that does not manage that client, when the RM views the client in an opportunity context, the returned data should only include companyName and ecosystemPositions (all other fields redacted).

**Validates: Requirements 1.4, 7.2, 7.3**

### Property 5: Ecosystem Position Completeness

*For any* created client, the client must have at least one ecosystem position from the supported set.

**Validates: Requirements 2.1, 2.2**

### Property 6: Banking Product Mapping Consistency

*For any* pair of complementary ecosystem positions, querying for banking products should return at least one relevant product, and all returned products should be applicable to that position pair.

**Validates: Requirements 2.4**

### Property 7: Match Score Validity

*For any* pair of clients from different RMs, generating a match score should produce a result with a score between 0 and 100, non-empty reasoning, and at least one suggested banking product.

**Validates: Requirements 3.1, 3.3**

### Property 8: High-Value Pairing Recognition

*For any* client pair matching known high-value patterns (Project Developers + Technology Suppliers, Project Developers + Storage Suppliers, EPC Contractors + Technology Suppliers, Project Sponsors + Project Developers, Energy Off-takers + Project Developers, Research/Innovation + Project Sponsors), the match score should be higher than the average score for random pairs.

**Validates: Requirements 3.2, 3.5**

### Property 9: Cross-RM Opportunity Constraint

*For any* generated opportunity, client1.rmId must not equal client2.rmId.

**Validates: Requirements 3.4**

### Property 10: Opportunity Brief Completeness

*For any* generated opportunity, the opportunity must contain non-empty values for title, trigger, reasoning, rm1Id, rm2Id, and at least one suggested banking product, with matchScore between 0 and 100.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 11: Opportunity Bilateral Access

*For any* opportunity involving two RMs, both rm1Id and rm2Id should be able to retrieve the opportunity when querying for their opportunities.

**Validates: Requirements 4.5**

### Property 12: Opportunity Display Completeness

*For any* opportunity rendered for display, the output should contain client names, ecosystem positions, match score, and RM identifiers.

**Validates: Requirements 5.1**

### Property 13: Opportunity Filtering Correctness

*For any* RM querying opportunities with a filter (client name, ecosystem position, or RM), all returned opportunities should match the filter criteria and involve at least one of the querying RM's clients.

**Validates: Requirements 5.2, 5.3**

### Property 14: Opportunity Retrieval Consistency

*For any* opportunity ID, retrieving the opportunity should return the same data as stored in the opportunity database.

**Validates: Requirements 5.4**

### Property 15: Default Sort Order

*For any* list of opportunities returned without explicit sorting, the list should be sorted by matchScore in descending order.

**Validates: Requirements 5.5**

### Property 16: Invitation Creation Success

*For any* valid opportunity and sender RM involved in that opportunity, creating an invitation should succeed and return an invitation with status 'pending'.

**Validates: Requirements 6.1**

### Property 17: Invitation Notification Delivery

*For any* invitation sent by an RM, the recipient RM should be able to retrieve that invitation when querying for their invitations.

**Validates: Requirements 6.2**

### Property 18: Invitation Sender Recording

*For any* created invitation, the invitation must have a non-empty senderRmId field.

**Validates: Requirements 6.3**

### Property 19: Duplicate Invitation Prevention

*For any* opportunity and sender RM, attempting to send a second invitation for the same opportunity should fail if a pending invitation already exists.

**Validates: Requirements 6.4**

### Property 20: Invitation Brief Association

*For any* invitation retrieved by an RM, the system should include the associated opportunity brief data.

**Validates: Requirements 6.5**

### Property 21: Authentication Requirement

*For any* system operation requiring RM identity, attempting the operation without valid authentication should fail with an authentication error.

**Validates: Requirements 7.1**

### Property 22: Unauthorized Modification Prevention

*For any* client and any RM that does not manage that client, attempting to modify the client should fail with an authorization error.

**Validates: Requirements 7.5**

### Property 23: Comprehensive Audit Logging

*For any* access to client data or LLM API call, the system should create an audit log entry with timestamp, actor, action, and resource information.

**Validates: Requirements 7.4, 8.3**

### Property 24: Opportunity Timestamp Presence

*For any* generated opportunity, the opportunity must have a non-null createdAt timestamp.

**Validates: Requirements 8.4**

### Property 25: Low-Confidence Flagging

*For any* opportunity generated with low confidence from the LLM, the opportunity should have flaggedForReview set to true.

**Validates: Requirements 8.5**

## Error Handling

### LLM Integration Errors

**Azure OpenAI API Errors:**
- Handle 401 Unauthorized (invalid API key)
- Handle 429 Too Many Requests (rate limiting)
- Handle 500 Internal Server Error (Azure service issues)
- Handle network timeouts and connection errors

**Timeout Handling:**
- LLM API calls should have a timeout (e.g., 30 seconds)
- On timeout, retry up to 3 times with exponential backoff
- If all retries fail, log the error and mark the opportunity as flagged for review

**Invalid Response Handling:**
- Validate LLM responses against expected schema
- If response is malformed, log the error and retry
- If response cannot be parsed after retries, skip the opportunity and log for investigation

**Rate Limiting:**
- Implement rate limiting for LLM API calls
- Queue requests when rate limit is approached
- Provide feedback to users when processing is delayed
- Use Azure OpenAI's rate limit headers to adjust request pacing

### Data Validation Errors

**Client Creation:**
- Return clear validation errors for missing or invalid fields
- Provide specific error messages (e.g., "companyName is required", "revenue must be non-negative")
- Do not create partial client records

**Opportunity Generation:**
- Skip client pairs that cannot be evaluated (e.g., missing ecosystem positions)
- Log skipped pairs for monitoring
- Continue processing remaining pairs

### Access Control Errors

**Authentication Failures:**
- Return 401 Unauthorized for missing or invalid credentials
- Do not reveal whether a user exists
- Log authentication attempts for security monitoring

**Authorization Failures:**
- Return 403 Forbidden for unauthorized access attempts
- Log authorization failures for audit
- Provide generic error messages to prevent information leakage

### Database Errors

**Connection Failures:**
- Retry database operations up to 3 times
- Use exponential backoff between retries
- Return 503 Service Unavailable if database is unreachable

**Constraint Violations:**
- Catch unique constraint violations (e.g., duplicate invitation)
- Return user-friendly error messages
- Log constraint violations for monitoring

## Testing Strategy

### MVP Testing Approach

**For this MVP/hackathon, formal testing is skipped to accelerate development.**

The focus is on demonstrating the concept with:
- Manual testing through the UI
- Verification with mock data
- Visual inspection of LLM-generated opportunity briefs

### Post-MVP Testing Recommendations

When moving beyond MVP, consider implementing:

**Property-Based Tests** for:
- Data persistence and round-trip properties
- Access control and authorization rules
- Invariants (e.g., all clients have exactly one RM)
- Filtering and sorting correctness

**Unit Tests** for:
- Specific ecosystem position mappings
- Mock data generation
- Error handling scenarios
- Component integration

**Integration Tests** for:
- End-to-end flows (create clients → generate opportunities → send invitations)
- LLM integration (timeout handling, response parsing)
- Authentication and authorization

### Performance Considerations

While not the focus of the MVP, be aware:
- LLM API calls are the bottleneck (can take seconds per pair)
- For N clients, there are O(N²) potential pairs
- Consider pagination for opportunity lists
- Consider caching LLM results for identical client pairs
- Consider processing opportunities asynchronously in background jobs

