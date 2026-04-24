# Opportunity Detection Service - Implementation Summary

## Overview

This document summarizes the implementation of Task 7: Opportunity Detection Service for the Cross-Ecosystem Opportunity Finder.

## Implemented Components

### 1. OpportunityDetectionService (`opportunityDetectionService.ts`)

**Purpose**: Generates and evaluates cross-RM client pairs for banking opportunities.

**Key Methods**:

- `generateCandidatePairs(clients: Client[]): OpportunityCandidate[]`
  - Creates all possible cross-RM client pairs
  - Filters to only include pairs from different RMs (Requirement 3.4)
  - Identifies complementary ecosystem positions
  - Prioritizes pairs with complementary positions and available banking products (Requirement 3.5)

- `evaluatePair(candidate: OpportunityCandidate): Promise<MatchResult>`
  - Evaluates a single client pair using LLM scoring service
  - Builds ecosystem context for the LLM prompt
  - Returns match score, reasoning, confidence, and suggested banking products (Requirements 3.1, 3.2, 3.3)

- `detectOpportunities(clients: Client[], minScore: number, options?): Promise<Opportunity[]>`
  - Processes all candidate pairs using batch LLM processing
  - Filters opportunities by minimum score threshold
  - Flags low-confidence opportunities for review (Requirement 8.5)
  - Stores opportunities in the opportunity store
  - Supports progress callbacks and configurable concurrency

**Requirements Satisfied**: 3.1, 3.2, 3.3, 3.4, 3.5, 8.5

### 2. OpportunityBriefService (`opportunityBriefService.ts`)

**Purpose**: Generates titles, triggers, and detailed briefs for opportunities using LLM services.

**Key Methods**:

- `generateBrief(opportunity: Opportunity): Promise<Opportunity>`
  - Generates complete opportunity brief with title and trigger
  - Ensures banking products are included from ecosystem mapping
  - Updates opportunity in store

- `generateTitle(opportunity: Opportunity): Promise<string>`
  - Uses LLM summary service to generate professional titles
  - Falls back to template-based titles if LLM fails
  - Requirement 4.1

- `generateTrigger(opportunity: Opportunity): Promise<string>`
  - Uses LLM detail service to generate concise trigger explanations
  - Falls back to reasoning excerpts if LLM fails
  - Requirement 4.2

- `generateDetailedExplanation(opportunity: Opportunity): Promise<string>`
  - Uses LLM detail service for comprehensive opportunity briefs
  - Falls back to structured explanations if LLM fails
  - Requirement 4.3

- `ensureBankingProducts(opportunity: Opportunity): BankingProduct[]`
  - Combines LLM-suggested products with ecosystem mapping products
  - Ensures all relevant banking products are included
  - Requirement 4.4

- `formatOpportunityForDisplay(opportunity: Opportunity, viewingRmId: string): string`
  - Formats opportunity for display with all required fields
  - Applies data redaction for cross-RM viewing
  - Requirement 4.1

**Requirements Satisfied**: 4.1, 4.2, 4.3, 4.4

## Architecture

```
OpportunityDetectionService
├── generateCandidatePairs()
│   ├── Filters cross-RM pairs
│   ├── Identifies complementary positions
│   └── Prioritizes candidates
│
├── evaluatePair()
│   ├── Builds ecosystem context
│   └── Calls LLM scoringService
│
└── detectOpportunities()
    ├── Uses batchProcessor for parallel LLM calls
    ├── Filters by score threshold
    ├── Flags low-confidence opportunities
    └── Stores opportunities

OpportunityBriefService
├── generateBrief()
│   ├── Calls generateTitle()
│   ├── Calls generateTrigger()
│   └── Ensures banking products
│
├── generateTitle() → LLM summaryService
├── generateTrigger() → LLM detailService
├── generateDetailedExplanation() → LLM detailService
└── formatOpportunityForDisplay()
```

## Integration Points

### Dependencies

- **EcosystemService**: For position relationships and banking product mappings
- **ScoringService**: For LLM-based match scoring
- **SummaryService**: For LLM-based title generation
- **DetailService**: For LLM-based trigger and explanation generation
- **BatchProcessor**: For efficient parallel LLM processing
- **OpportunityStore**: For persisting opportunities

### Data Flow

1. **Input**: List of clients from different RMs
2. **Candidate Generation**: Create all cross-RM pairs with complementary positions
3. **Batch Evaluation**: Process pairs in parallel using LLM scoring
4. **Filtering**: Keep only opportunities above score threshold
5. **Brief Generation**: Generate titles and triggers using LLM
6. **Storage**: Persist opportunities in store
7. **Output**: List of complete opportunities with briefs

## Testing

### Test Scripts

1. **test-opportunity-detection.ts**: Basic structure test (no LLM calls)
   - Verifies candidate generation
   - Checks cross-RM filtering
   - Validates complementary position prioritization
   - Run with: `npm run test:opportunity`

2. **test-opportunity-detection-full.ts**: Full integration test (with LLM calls)
   - Tests complete flow from clients to opportunities
   - Generates actual LLM-based match scores
   - Creates titles and triggers
   - Requires Azure OpenAI API key
   - Run with: `npm run test:opportunity-full`

### Test Results

All tests pass successfully:
- ✓ Candidate generation creates cross-RM pairs only
- ✓ Complementary positions are prioritized
- ✓ Batch processing works efficiently
- ✓ LLM integration generates valid match scores
- ✓ Brief generation creates titles and triggers
- ✓ Banking products are included from ecosystem mapping

## Error Handling

### LLM Failures

- **Title Generation**: Falls back to template-based titles
- **Trigger Generation**: Falls back to reasoning excerpts
- **Detailed Explanation**: Falls back to structured explanations
- **Scoring**: Returns low-confidence result with score 0

### Batch Processing

- Errors are logged but don't stop processing
- Failed pairs are skipped
- Progress callbacks continue for successful pairs

### Low Confidence

- Opportunities with confidence='low' are flagged for review
- Opportunities with score < 60 are flagged for review
- Flagged opportunities are still stored but marked

## Performance Considerations

### Batch Processing

- Default concurrency: 5 parallel LLM calls
- Configurable via options parameter
- Rate limiting: 100ms delay between batches
- Progress callbacks for monitoring

### Scalability

- For N clients, generates O(N²) candidate pairs
- Batch processing reduces total time significantly
- Consider pagination for large client lists
- Consider caching LLM results for identical pairs

## Next Steps

The following tasks depend on this implementation:

- **Task 8**: RM Collaboration Service (uses opportunities)
- **Task 10**: Mock Data (provides test clients)
- **Task 11**: Opportunity Discovery and Filtering (queries opportunities)
- **Task 12**: API Routes (exposes opportunity detection)
- **Task 14**: UI Components (displays opportunities)

## Requirements Traceability

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| 3.1 | LLM-based match scoring via scoringService | ✓ |
| 3.2 | High-value pairing patterns in LLM prompts | ✓ |
| 3.3 | Match score, reasoning, and products returned | ✓ |
| 3.4 | Cross-RM filtering in generateCandidatePairs | ✓ |
| 3.5 | Complementary position prioritization | ✓ |
| 4.1 | Title generation and display formatting | ✓ |
| 4.2 | Trigger explanation generation | ✓ |
| 4.3 | Detailed brief generation | ✓ |
| 4.4 | Banking products from ecosystem mapping | ✓ |
| 8.5 | Low-confidence flagging | ✓ |

## Files Created

- `src/lib/services/opportunityDetectionService.ts`
- `src/lib/services/opportunityBriefService.ts`
- `src/scripts/test-opportunity-detection.ts`
- `src/scripts/test-opportunity-detection-full.ts`
- `src/lib/services/README-OPPORTUNITY-DETECTION.md` (this file)

## Conclusion

Task 7 has been successfully implemented with all subtasks completed:
- ✓ Task 7.1: Opportunity candidate generation
- ✓ Task 7.2: Opportunity evaluation with batch LLM processing
- ✓ Task 7.3: Opportunity brief generation

All requirements (3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 8.5) have been satisfied.
