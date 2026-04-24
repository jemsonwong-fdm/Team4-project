/**
 * Summary Service for generating opportunity brief titles
 * Creates concise, descriptive titles for opportunities
 */

import { baseLLMService } from './base';
import type { Opportunity } from '@/lib/models';
import type { LLMPrompt } from './base';

export class SummaryService {
    /**
     * Generate a brief title for an opportunity
     */
    async generateSummary(opportunity: Opportunity): Promise<string> {
        const prompt = this.buildSummaryPrompt(opportunity);

        const response = await baseLLMService.sendRequest(prompt, opportunity.id);

        return this.parseSummary(response.content);
    }

    /**
     * Build the summary prompt for LLM
     */
    private buildSummaryPrompt(opportunity: Opportunity): LLMPrompt {
        const systemPrompt = `You are an expert at creating concise, compelling opportunity titles for banking professionals.

Generate a brief, professional title (maximum 80 characters) that captures the essence of a cross-segment banking opportunity.

The title should:
- Mention both companies by name
- Indicate the type of opportunity or banking product
- Be clear and actionable
- Use professional banking language

Examples:
- "SolarTech & GreenPower: Project Finance for 500MW Solar Portfolio"
- "WindCorp + StoragePlus: Working Capital for Battery Integration"
- "CleanEnergy Dev & EPC Solutions: Infrastructure Debt Advisory"

Provide ONLY the title text, no additional explanation or formatting.`;

        const userPrompt = `Generate a title for this opportunity:

Client 1: ${opportunity.client1.companyName} (${opportunity.client1.ecosystemPositions.join(', ')})
Client 2: ${opportunity.client2.companyName} (${opportunity.client2.ecosystemPositions.join(', ')})

Match Score: ${opportunity.matchScore}
Suggested Banking Products: ${opportunity.suggestedBankingProducts.map(p => p.name).join(', ')}
Reasoning: ${opportunity.reasoning}

Generate a concise, professional title.`;

        return {
            systemPrompt,
            userPrompt,
            temperature: 0.5,
            maxTokens: 100
        };
    }

    /**
     * Parse and clean the summary from LLM response
     */
    private parseSummary(content: string): string {
        // Remove quotes if present
        let summary = content.trim().replace(/^["']|["']$/g, '');

        // Truncate if too long
        if (summary.length > 100) {
            summary = summary.substring(0, 97) + '...';
        }

        // Fallback if empty
        if (!summary) {
            summary = 'Cross-Segment Banking Opportunity';
        }

        return summary;
    }
}

// Export singleton instance
export const summaryService = new SummaryService();
