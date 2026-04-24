/**
 * Scoring Service for LLM-based match scoring
 * Evaluates client pairs and generates match scores with reasoning
 */

import { baseLLMService } from './base';
import type { Client, MatchResult, BankingProduct } from '@/lib/models';
import type { LLMPrompt } from './base';

export class ScoringService {
    /**
     * Score a client pair for opportunity matching
     */
    async scoreMatch(
        client1: Client,
        client2: Client,
        ecosystemContext: string,
        relatedOpportunityId?: string
    ): Promise<MatchResult> {
        const prompt = this.buildScoringPrompt(client1, client2, ecosystemContext);

        const response = await baseLLMService.sendRequest(prompt, relatedOpportunityId);

        return this.parseMatchResult(response.content);
    }

    /**
     * Build the scoring prompt for LLM
     */
    private buildScoringPrompt(
        client1: Client,
        client2: Client,
        ecosystemContext: string
    ): LLMPrompt {
        const systemPrompt = `You are an expert in clean power banking and ecosystem analysis. Your task is to evaluate cross-segment client pairings and determine their potential for creating banking opportunities.

Analyze the compatibility between two clients based on:
1. Ecosystem position complementarity (value chain relationships)
2. Geographic alignment or strategic expansion opportunities
3. Revenue scale compatibility
4. ESG alignment synergies
5. Potential for banking product opportunities

Provide your response in the following JSON format:
{
  "score": <number between 0-100>,
  "confidence": "<high|medium|low>",
  "reasoning": "<detailed explanation of why this pairing has potential>",
  "suggestedBankingProducts": [
    {
      "name": "<product name>",
      "description": "<why this product fits>",
      "applicablePositionPairs": []
    }
  ]
}

High-value pairing patterns to prioritize:
- Project Developers + Technology Suppliers (infrastructure finance, debt advisory)
- Project Developers + Storage Suppliers (green portfolio financing)
- EPC Contractors + Technology Suppliers (working capital, guarantees)
- Project Sponsors + Project Developers (blended finance, capital raising)
- Energy Off-takers + Project Developers (PPA-backed financing)
- Research/Innovation + Project Sponsors (venture debt)

${ecosystemContext}`;

        const userPrompt = `Evaluate this client pairing:

Client 1:
- Company: ${client1.companyName}
- Ecosystem Positions: ${client1.ecosystemPositions.join(', ')}
- Geography: ${client1.geography}
- Revenue: $${client1.revenue.toLocaleString()}
- ESG Alignment: ${client1.esgAlignment}

Client 2:
- Company: ${client2.companyName}
- Ecosystem Positions: ${client2.ecosystemPositions.join(', ')}
- Geography: ${client2.geography}
- Revenue: $${client2.revenue.toLocaleString()}
- ESG Alignment: ${client2.esgAlignment}

Provide a comprehensive match score and analysis.`;

        return {
            systemPrompt,
            userPrompt,
            temperature: 0.7,
            maxTokens: 1000
        };
    }

    /**
     * Parse LLM response into MatchResult
     */
    private parseMatchResult(content: string): MatchResult {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate and normalize the response
            const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
            const confidence = this.normalizeConfidence(parsed.confidence);
            const reasoning = parsed.reasoning || 'No reasoning provided';
            const suggestedBankingProducts = this.normalizeBankingProducts(parsed.suggestedBankingProducts || []);

            return {
                score,
                confidence,
                reasoning,
                suggestedBankingProducts
            };
        } catch (error) {
            console.error('Failed to parse LLM scoring response:', error);

            // Return a low-confidence fallback result
            return {
                score: 0,
                confidence: 'low',
                reasoning: 'Failed to parse LLM response. Manual review required.',
                suggestedBankingProducts: []
            };
        }
    }

    /**
     * Normalize confidence level
     */
    private normalizeConfidence(confidence: string): 'high' | 'medium' | 'low' {
        const normalized = confidence?.toLowerCase();
        if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
            return normalized;
        }
        return 'low';
    }

    /**
     * Normalize banking products from LLM response
     */
    private normalizeBankingProducts(products: any[]): BankingProduct[] {
        if (!Array.isArray(products)) {
            return [];
        }

        return products
            .filter(p => p && typeof p === 'object' && p.name)
            .map(p => ({
                name: p.name,
                description: p.description || '',
                applicablePositionPairs: p.applicablePositionPairs || []
            }));
    }
}

// Export singleton instance
export const scoringService = new ScoringService();
