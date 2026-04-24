/**
 * Opportunity Detection Service
 * Generates and evaluates cross-RM client pairs for banking opportunities
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.5
 */

import { randomUUID } from 'crypto';
import type { Client, OpportunityCandidate, EcosystemPosition, MatchResult, Opportunity } from '../models';
import { ecosystemService } from './ecosystemService';
import { scoringService } from './llm/scoringService';
import { batchProcessor } from './llm/batchProcessor';
import { opportunityStore } from '../data/stores';

export class OpportunityDetectionService {
    /**
     * Generate all candidate client pairs for opportunity detection
     * Only includes pairs from different RMs with complementary ecosystem positions
     * Requirements: 3.4, 3.5
     */
    generateCandidatePairs(clients: Client[]): OpportunityCandidate[] {
        const candidates: OpportunityCandidate[] = [];

        // Generate all possible pairs
        for (let i = 0; i < clients.length; i++) {
            for (let j = i + 1; j < clients.length; j++) {
                const client1 = clients[i];
                const client2 = clients[j];

                // Filter: Only include pairs from different RMs (Requirement 3.4)
                if (client1.rmId === client2.rmId) {
                    continue;
                }

                // Check for complementary ecosystem positions
                const positionPairs = this.findComplementaryPositionPairs(
                    client1.ecosystemPositions,
                    client2.ecosystemPositions
                );

                // If no complementary positions found, still include but with lower priority
                if (positionPairs.length > 0) {
                    // Create a candidate for each complementary position pair
                    for (const positionPair of positionPairs) {
                        candidates.push({
                            client1,
                            client2,
                            ecosystemPositionPair: positionPair
                        });
                    }
                } else {
                    // Include non-complementary pairs but use first positions as default
                    candidates.push({
                        client1,
                        client2,
                        ecosystemPositionPair: [
                            client1.ecosystemPositions[0],
                            client2.ecosystemPositions[0]
                        ]
                    });
                }
            }
        }

        // Prioritize pairs with complementary ecosystem positions (Requirement 3.5)
        return this.prioritizeCandidates(candidates);
    }

    /**
     * Find all complementary position pairs between two clients
     */
    private findComplementaryPositionPairs(
        positions1: EcosystemPosition[],
        positions2: EcosystemPosition[]
    ): [EcosystemPosition, EcosystemPosition][] {
        const pairs: [EcosystemPosition, EcosystemPosition][] = [];

        for (const pos1 of positions1) {
            for (const pos2 of positions2) {
                if (ecosystemService.arePositionsComplementary(pos1, pos2)) {
                    pairs.push([pos1, pos2]);
                }
            }
        }

        return pairs;
    }

    /**
     * Prioritize candidates based on ecosystem position complementarity
     * Candidates with complementary positions are ranked higher
     */
    private prioritizeCandidates(candidates: OpportunityCandidate[]): OpportunityCandidate[] {
        return candidates.sort((a, b) => {
            const aIsComplementary = ecosystemService.arePositionsComplementary(
                a.ecosystemPositionPair[0],
                a.ecosystemPositionPair[1]
            );
            const bIsComplementary = ecosystemService.arePositionsComplementary(
                b.ecosystemPositionPair[0],
                b.ecosystemPositionPair[1]
            );

            // Complementary pairs first
            if (aIsComplementary && !bIsComplementary) return -1;
            if (!aIsComplementary && bIsComplementary) return 1;

            // Check if banking products are available for the pair
            const aHasProducts = ecosystemService.getBankingProductsForPair(
                a.ecosystemPositionPair[0],
                a.ecosystemPositionPair[1]
            ).length > 0;
            const bHasProducts = ecosystemService.getBankingProductsForPair(
                b.ecosystemPositionPair[0],
                b.ecosystemPositionPair[1]
            ).length > 0;

            // Pairs with banking products next
            if (aHasProducts && !bHasProducts) return -1;
            if (!aHasProducts && bHasProducts) return 1;

            return 0;
        });
    }

    /**
     * Evaluate a single client pair using LLM scoring
     * Requirements: 3.1, 3.2, 3.3
     */
    async evaluatePair(candidate: OpportunityCandidate): Promise<MatchResult> {
        // Build ecosystem context for the LLM
        const ecosystemContext = this.buildEcosystemContext(candidate);

        // Call LLM scoring service
        const matchResult = await scoringService.scoreMatch(
            candidate.client1,
            candidate.client2,
            ecosystemContext
        );

        return matchResult;
    }

    /**
     * Detect opportunities from a list of clients using batch LLM processing
     * Requirements: 3.1, 3.2, 3.3, 8.5
     */
    async detectOpportunities(
        clients: Client[],
        minScore: number = 50,
        options?: {
            onProgress?: (completed: number, total: number) => void;
            concurrency?: number;
        }
    ): Promise<Opportunity[]> {
        // Generate candidate pairs
        const candidates = this.generateCandidatePairs(clients);

        if (candidates.length === 0) {
            return [];
        }

        console.log(`Generated ${candidates.length} candidate pairs for evaluation`);

        // Process candidates in batches using batch processor
        const matchResults = await batchProcessor.processBatch(
            candidates,
            async (candidate) => {
                const matchResult = await this.evaluatePair(candidate);
                return { candidate, matchResult };
            },
            {
                concurrency: options?.concurrency || 5,
                onProgress: options?.onProgress,
                onError: (error, candidate) => {
                    console.error(`Failed to evaluate pair: ${candidate.client1.companyName} + ${candidate.client2.companyName}`, error);
                }
            }
        );

        // Filter by minimum score threshold
        const filteredResults = matchResults.filter(
            result => result.matchResult.score >= minScore
        );

        console.log(`${filteredResults.length} opportunities found above threshold (${minScore})`);

        // Create opportunity objects
        const opportunities: Opportunity[] = [];

        for (const { candidate, matchResult } of filteredResults) {
            // Flag low-confidence opportunities for review (Requirement 8.5)
            const flaggedForReview = matchResult.confidence === 'low' || matchResult.score < 60;

            const opportunity: Opportunity = {
                id: randomUUID(),
                title: '', // Will be generated by OpportunityBriefService
                client1: candidate.client1,
                client2: candidate.client2,
                rm1Id: candidate.client1.rmId,
                rm2Id: candidate.client2.rmId,
                trigger: '', // Will be generated by OpportunityBriefService
                suggestedBankingProducts: matchResult.suggestedBankingProducts,
                matchScore: matchResult.score,
                reasoning: matchResult.reasoning,
                confidence: matchResult.confidence,
                createdAt: new Date(),
                flaggedForReview
            };

            // Store opportunity
            opportunityStore.create(opportunity);
            opportunities.push(opportunity);
        }

        return opportunities;
    }

    /**
     * Build ecosystem context string for LLM prompts
     */
    private buildEcosystemContext(candidate: OpportunityCandidate): string {
        const [pos1, pos2] = candidate.ecosystemPositionPair;

        // Get banking products for this position pair
        const bankingProducts = ecosystemService.getBankingProductsForPair(pos1, pos2);

        // Check if positions are complementary
        const isComplementary = ecosystemService.arePositionsComplementary(pos1, pos2);

        let context = `Ecosystem Context:\n`;
        context += `- Position Pair: ${pos1} + ${pos2}\n`;
        context += `- Complementary: ${isComplementary ? 'Yes' : 'No'}\n`;

        if (bankingProducts.length > 0) {
            context += `- Available Banking Products:\n`;
            for (const product of bankingProducts) {
                context += `  * ${product.name}: ${product.description}\n`;
            }
        } else {
            context += `- No pre-defined banking products for this position pair (explore custom opportunities)\n`;
        }

        return context;
    }
}

// Export singleton instance
export const opportunityDetectionService = new OpportunityDetectionService();
