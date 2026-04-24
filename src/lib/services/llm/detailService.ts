/**
 * Detail Service for generating detailed opportunity briefs
 * Creates comprehensive explanations of why opportunities exist
 */

import { baseLLMService } from './base';
import type { Opportunity } from '@/lib/models';
import type { LLMPrompt } from './base';

export class DetailService {
    /**
     * Generate a detailed brief for an opportunity
     */
    async generateDetailedBrief(opportunity: Opportunity): Promise<string> {
        const prompt = this.buildDetailPrompt(opportunity);

        const response = await baseLLMService.sendRequest(prompt, opportunity.id);

        return this.parseDetail(response.content);
    }

    /**
     * Build the detail prompt for LLM
     */
    private buildDetailPrompt(opportunity: Opportunity): LLMPrompt {
        const systemPrompt = `You are an expert banking relationship manager specializing in clean power ecosystem opportunities.

Generate a detailed, professional opportunity brief that explains:
1. Why these two clients should be connected
2. The specific value chain relationship between their ecosystem positions
3. How their geographic and scale characteristics complement each other
4. The specific banking products that could be offered
5. The strategic rationale for the bank to facilitate this introduction

Write in a professional, persuasive tone suitable for senior banking executives.
Structure the brief with clear sections and bullet points where appropriate.
Keep the total length to 300-500 words.`;

        const userPrompt = `Generate a detailed opportunity brief for:

Client 1: ${opportunity.client1.companyName}
- Ecosystem Positions: ${opportunity.client1.ecosystemPositions.join(', ')}
- Geography: ${opportunity.client1.geography}
- Revenue: $${opportunity.client1.revenue.toLocaleString()}
- ESG Alignment: ${opportunity.client1.esgAlignment}

Client 2: ${opportunity.client2.companyName}
- Ecosystem Positions: ${opportunity.client2.ecosystemPositions.join(', ')}
- Geography: ${opportunity.client2.geography}
- Revenue: $${opportunity.client2.revenue.toLocaleString()}
- ESG Alignment: ${opportunity.client2.esgAlignment}

Match Score: ${opportunity.matchScore}/100
Confidence: ${opportunity.confidence}

Initial Analysis: ${opportunity.reasoning}

Suggested Banking Products:
${opportunity.suggestedBankingProducts.map(p => `- ${p.name}: ${p.description}`).join('\n')}

Create a comprehensive opportunity brief that will help relationship managers understand and act on this opportunity.`;

        return {
            systemPrompt,
            userPrompt,
            temperature: 0.6,
            maxTokens: 800
        };
    }

    /**
     * Parse and format the detailed brief from LLM response
     */
    private parseDetail(content: string): string {
        // Clean up the response
        let detail = content.trim();

        // Ensure minimum content
        if (detail.length < 50) {
            detail = 'This opportunity represents a strategic cross-segment pairing in the clean power ecosystem. Further analysis recommended.';
        }

        return detail;
    }

    /**
     * Generate a trigger explanation (shorter version for opportunity cards)
     */
    async generateTrigger(opportunity: Opportunity): Promise<string> {
        const prompt = this.buildTriggerPrompt(opportunity);

        const response = await baseLLMService.sendRequest(prompt, opportunity.id);

        return this.parseTrigger(response.content);
    }

    /**
     * Build the trigger prompt for LLM
     */
    private buildTriggerPrompt(opportunity: Opportunity): LLMPrompt {
        const systemPrompt = `You are an expert at creating concise opportunity triggers for banking professionals.

Generate a brief explanation (1-2 sentences, maximum 150 characters) of WHY this opportunity exists.

Focus on:
- The key value chain relationship
- The primary banking opportunity
- The strategic fit

Be specific and actionable. Use professional banking language.

Provide ONLY the trigger text, no additional explanation.`;

        const userPrompt = `Generate a trigger explanation for:

Client 1: ${opportunity.client1.companyName} (${opportunity.client1.ecosystemPositions.join(', ')})
Client 2: ${opportunity.client2.companyName} (${opportunity.client2.ecosystemPositions.join(', ')})

Reasoning: ${opportunity.reasoning}

Banking Products: ${opportunity.suggestedBankingProducts.map(p => p.name).join(', ')}

Generate a concise trigger explanation.`;

        return {
            systemPrompt,
            userPrompt,
            temperature: 0.5,
            maxTokens: 100
        };
    }

    /**
     * Parse and clean the trigger from LLM response
     */
    private parseTrigger(content: string): string {
        // Remove quotes if present
        let trigger = content.trim().replace(/^["']|["']$/g, '');

        // Truncate if too long
        if (trigger.length > 200) {
            trigger = trigger.substring(0, 197) + '...';
        }

        // Fallback if empty
        if (!trigger) {
            trigger = 'Strategic cross-segment opportunity in clean power ecosystem.';
        }

        return trigger;
    }
}

// Export singleton instance
export const detailService = new DetailService();
