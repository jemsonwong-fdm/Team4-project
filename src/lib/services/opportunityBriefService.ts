/**
 * Opportunity Brief Service
 * Generates titles, triggers, and detailed briefs for opportunities
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import type { Opportunity, BankingProduct } from '../models';
import { summaryService } from './llm/summaryService';
import { detailService } from './llm/detailService';
import { ecosystemService } from './ecosystemService';
import { opportunityStore } from '../data/stores';

export class OpportunityBriefService {
    /**
     * Generate a complete opportunity brief with title and trigger
     * Requirements: 4.1, 4.2, 4.3, 4.4
     */
    async generateBrief(opportunity: Opportunity): Promise<Opportunity> {
        // Generate title using LLM summary service
        const title = await this.generateTitle(opportunity);

        // Generate trigger explanation using LLM detail service
        const trigger = await this.generateTrigger(opportunity);

        // Ensure banking products are included from ecosystem mapping
        const bankingProducts = this.ensureBankingProducts(opportunity);

        // Update opportunity with generated content
        const updatedOpportunity: Opportunity = {
            ...opportunity,
            title,
            trigger,
            suggestedBankingProducts: bankingProducts
        };

        // Update in store
        opportunityStore.update(opportunity.id, updatedOpportunity);

        return updatedOpportunity;
    }

    /**
     * Generate descriptive title based on client names and positions
     * Uses LLM summary service
     * Requirement: 4.1
     */
    async generateTitle(opportunity: Opportunity): Promise<string> {
        try {
            // Use LLM to generate a professional title
            const title = await summaryService.generateSummary(opportunity);
            return title;
        } catch (error) {
            console.error('Failed to generate title with LLM, using fallback', error);
            // Fallback to template-based title
            return this.generateFallbackTitle(opportunity);
        }
    }

    /**
     * Generate trigger explanation from LLM reasoning
     * Uses LLM detail service
     * Requirement: 4.2
     */
    async generateTrigger(opportunity: Opportunity): Promise<string> {
        try {
            // Use LLM to generate a concise trigger explanation
            const trigger = await detailService.generateTrigger(opportunity);
            return trigger;
        } catch (error) {
            console.error('Failed to generate trigger with LLM, using fallback', error);
            // Fallback to reasoning excerpt
            return this.generateFallbackTrigger(opportunity);
        }
    }

    /**
     * Generate detailed explanation using LLM detail service
     * Requirement: 4.3
     */
    async generateDetailedExplanation(opportunity: Opportunity): Promise<string> {
        try {
            const detailedBrief = await detailService.generateDetailedBrief(opportunity);
            return detailedBrief;
        } catch (error) {
            console.error('Failed to generate detailed brief with LLM, using fallback', error);
            // Fallback to structured explanation
            return this.generateFallbackExplanation(opportunity);
        }
    }

    /**
     * Ensure banking products are included from ecosystem mapping
     * Requirement: 4.4
     */
    private ensureBankingProducts(opportunity: Opportunity): BankingProduct[] {
        // Start with LLM-suggested products
        let products = [...opportunity.suggestedBankingProducts];

        // Get products from ecosystem mapping based on positions
        const client1Positions = opportunity.client1.ecosystemPositions;
        const client2Positions = opportunity.client2.ecosystemPositions;

        // Find all applicable banking products for position pairs
        for (const pos1 of client1Positions) {
            for (const pos2 of client2Positions) {
                const mappedProducts = ecosystemService.getBankingProductsForPair(pos1, pos2);

                // Add products that aren't already in the list
                for (const product of mappedProducts) {
                    if (!products.some(p => p.name === product.name)) {
                        products.push(product);
                    }
                }
            }
        }

        // If still no products, add generic ones
        if (products.length === 0) {
            products = this.getGenericBankingProducts();
        }

        return products;
    }

    /**
     * Format opportunity for display with all required fields
     * Requirement: 4.1
     */
    formatOpportunityForDisplay(opportunity: Opportunity, viewingRmId: string): string {
        const isClient1Owner = opportunity.rm1Id === viewingRmId;
        const isClient2Owner = opportunity.rm2Id === viewingRmId;

        let display = `# ${opportunity.title}\n\n`;

        // Players section
        display += `## Players\n`;
        display += `- **${opportunity.client1.companyName}** (${opportunity.client1.ecosystemPositions.join(', ')})\n`;
        display += `  - RM: ${opportunity.rm1Id}${isClient1Owner ? ' (You)' : ''}\n`;
        display += `  - Geography: ${opportunity.client1.geography}\n`;
        if (isClient1Owner) {
            display += `  - Revenue: ${opportunity.client1.revenue.toLocaleString()}\n`;
            display += `  - ESG: ${opportunity.client1.esgAlignment}\n`;
        }

        display += `\n- **${opportunity.client2.companyName}** (${opportunity.client2.ecosystemPositions.join(', ')})\n`;
        display += `  - RM: ${opportunity.rm2Id}${isClient2Owner ? ' (You)' : ''}\n`;
        display += `  - Geography: ${opportunity.client2.geography}\n`;
        if (isClient2Owner) {
            display += `  - Revenue: ${opportunity.client2.revenue.toLocaleString()}\n`;
            display += `  - ESG: ${opportunity.client2.esgAlignment}\n`;
        }

        // Trigger section
        display += `\n## Why This Opportunity Exists\n`;
        display += `${opportunity.trigger}\n`;

        // Banking products section
        display += `\n## Suggested Banking Products\n`;
        for (const product of opportunity.suggestedBankingProducts) {
            display += `- **${product.name}**: ${product.description}\n`;
        }

        // Match details section
        display += `\n## Match Details\n`;
        display += `- **Score**: ${opportunity.matchScore}/100\n`;
        display += `- **Confidence**: ${opportunity.confidence}\n`;
        display += `- **Created**: ${opportunity.createdAt.toLocaleDateString()}\n`;
        if (opportunity.flaggedForReview) {
            display += `- **Status**: ⚠️ Flagged for Review\n`;
        }

        // Reasoning section
        display += `\n## Analysis\n`;
        display += `${opportunity.reasoning}\n`;

        return display;
    }

    /**
     * Generate fallback title when LLM fails
     */
    private generateFallbackTitle(opportunity: Opportunity): string {
        const product = opportunity.suggestedBankingProducts[0]?.name || 'Banking Opportunity';
        return `${opportunity.client1.companyName} & ${opportunity.client2.companyName}: ${product}`;
    }

    /**
     * Generate fallback trigger when LLM fails
     */
    private generateFallbackTrigger(opportunity: Opportunity): string {
        // Extract first sentence from reasoning
        const firstSentence = opportunity.reasoning.split('.')[0];
        if (firstSentence && firstSentence.length < 200) {
            return firstSentence + '.';
        }

        // Generic fallback
        const pos1 = opportunity.client1.ecosystemPositions[0];
        const pos2 = opportunity.client2.ecosystemPositions[0];
        return `Strategic pairing between ${pos1} and ${pos2} in the clean power ecosystem.`;
    }

    /**
     * Generate fallback explanation when LLM fails
     */
    private generateFallbackExplanation(opportunity: Opportunity): string {
        let explanation = `## Opportunity Overview\n\n`;
        explanation += `This opportunity brings together ${opportunity.client1.companyName} and ${opportunity.client2.companyName} `;
        explanation += `in a strategic cross-segment pairing.\n\n`;

        explanation += `## Value Chain Relationship\n\n`;
        explanation += `${opportunity.client1.companyName} operates as ${opportunity.client1.ecosystemPositions.join(', ')}, `;
        explanation += `while ${opportunity.client2.companyName} serves as ${opportunity.client2.ecosystemPositions.join(', ')}. `;
        explanation += `This complementary positioning creates opportunities for collaboration.\n\n`;

        explanation += `## Banking Opportunities\n\n`;
        explanation += `The following banking products are relevant for this pairing:\n\n`;
        for (const product of opportunity.suggestedBankingProducts) {
            explanation += `- **${product.name}**: ${product.description}\n`;
        }

        explanation += `\n## Initial Analysis\n\n`;
        explanation += opportunity.reasoning;

        return explanation;
    }

    /**
     * Get generic banking products as fallback
     */
    private getGenericBankingProducts(): BankingProduct[] {
        return [
            {
                name: 'Corporate Banking Services',
                description: 'General corporate banking and relationship management',
                applicablePositionPairs: []
            },
            {
                name: 'Strategic Advisory',
                description: 'Strategic financial advisory for business development',
                applicablePositionPairs: []
            }
        ];
    }
}

// Export singleton instance
export const opportunityBriefService = new OpportunityBriefService();
