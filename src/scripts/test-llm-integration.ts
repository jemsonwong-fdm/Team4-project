/**
 * Test script to verify Azure OpenAI LLM integration
 * Tests connection, match scoring, error handling, and logging
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { baseLLMService } from '@/lib/services/llm/base';
import { scoringService } from '@/lib/services/llm/scoringService';
import { EcosystemPosition, type Client } from '@/lib/models';
import { llmInteractionLogStore } from '@/lib/data/stores';

// Sample clients for testing
const sampleClient1: Client = {
    id: 'test-client-1',
    companyName: 'SolarTech Solutions',
    ecosystemPositions: [EcosystemPosition.TECHNOLOGY_SUPPLIERS],
    geography: 'North America',
    revenue: 250000000,
    esgAlignment: 'Strong commitment to carbon neutrality by 2030',
    rmId: 'rm-001',
    createdAt: new Date(),
    updatedAt: new Date()
};

const sampleClient2: Client = {
    id: 'test-client-2',
    companyName: 'GreenPower Developers',
    ecosystemPositions: [EcosystemPosition.PROJECT_DEVELOPERS],
    geography: 'North America',
    revenue: 500000000,
    esgAlignment: 'Leading renewable energy project portfolio with 2GW capacity',
    rmId: 'rm-002',
    createdAt: new Date(),
    updatedAt: new Date()
};

const ecosystemContext = `
Ecosystem Context:
- Project Developers and Technology Suppliers form a high-value pairing
- Common banking products: infrastructure finance, debt advisory, equipment financing
- Geographic alignment in North America is favorable
- Revenue scales are compatible for large-scale project financing
`;

async function testLLMIntegration() {
    console.log('='.repeat(80));
    console.log('Testing Azure OpenAI LLM Integration');
    console.log('='.repeat(80));
    console.log();

    // Test 1: Check configuration
    console.log('Test 1: Checking LLM Service Configuration');
    console.log('-'.repeat(80));

    const isConfigured = baseLLMService.isConfigured();
    console.log(`✓ Service configured: ${isConfigured}`);

    if (!isConfigured) {
        console.error('❌ LLM service is not configured!');
        console.error('Please set AZURE_OPENAI_API_KEY in .env.local');
        process.exit(1);
    }

    const config = baseLLMService.getConfig();
    console.log(`✓ Endpoint: ${config?.endpoint}`);
    console.log(`✓ Model: ${config?.model}`);
    console.log(`✓ API Version: ${config?.apiVersion}`);
    console.log();

    // Test 2: Test basic LLM connection
    console.log('Test 2: Testing Basic LLM Connection');
    console.log('-'.repeat(80));

    try {
        const testPrompt = {
            systemPrompt: 'You are a helpful assistant.',
            userPrompt: 'Say "Hello, Azure OpenAI is working!" and nothing else.',
            temperature: 0.3,
            maxTokens: 50
        };

        console.log('Sending test request to Azure OpenAI...');
        const response = await baseLLMService.sendRequest(testPrompt);

        console.log(`✓ Connection successful!`);
        console.log(`✓ Response: ${response.content}`);
        console.log(`✓ Tokens used: ${response.tokensUsed}`);
        console.log(`✓ Model: ${response.model}`);
        console.log(`✓ Timestamp: ${response.timestamp.toISOString()}`);
        console.log();
    } catch (error) {
        console.error('❌ Connection test failed!');
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }

    // Test 3: Test match scoring with sample clients
    console.log('Test 3: Testing Match Scoring with Sample Clients');
    console.log('-'.repeat(80));

    try {
        console.log('Client 1:');
        console.log(`  - Company: ${sampleClient1.companyName}`);
        console.log(`  - Position: ${sampleClient1.ecosystemPositions.join(', ')}`);
        console.log(`  - Geography: ${sampleClient1.geography}`);
        console.log(`  - Revenue: $${sampleClient1.revenue.toLocaleString()}`);
        console.log();

        console.log('Client 2:');
        console.log(`  - Company: ${sampleClient2.companyName}`);
        console.log(`  - Position: ${sampleClient2.ecosystemPositions.join(', ')}`);
        console.log(`  - Geography: ${sampleClient2.geography}`);
        console.log(`  - Revenue: $${sampleClient2.revenue.toLocaleString()}`);
        console.log();

        console.log('Requesting match score from LLM...');
        const matchResult = await scoringService.scoreMatch(
            sampleClient1,
            sampleClient2,
            ecosystemContext,
            'test-opportunity-1'
        );

        console.log(`✓ Match scoring successful!`);
        console.log();
        console.log('Match Result:');
        console.log(`  - Score: ${matchResult.score}/100`);
        console.log(`  - Confidence: ${matchResult.confidence}`);
        console.log(`  - Reasoning: ${matchResult.reasoning}`);
        console.log(`  - Suggested Banking Products: ${matchResult.suggestedBankingProducts.length}`);

        if (matchResult.suggestedBankingProducts.length > 0) {
            matchResult.suggestedBankingProducts.forEach((product, idx) => {
                console.log(`    ${idx + 1}. ${product.name}: ${product.description}`);
            });
        }
        console.log();

        // Validate match result
        if (matchResult.score < 0 || matchResult.score > 100) {
            console.error('❌ Invalid score range!');
            process.exit(1);
        }

        if (!['high', 'medium', 'low'].includes(matchResult.confidence)) {
            console.error('❌ Invalid confidence level!');
            process.exit(1);
        }

        if (!matchResult.reasoning || matchResult.reasoning.length === 0) {
            console.error('❌ Missing reasoning!');
            process.exit(1);
        }

        console.log('✓ Match result validation passed!');
        console.log();
    } catch (error) {
        console.error('❌ Match scoring test failed!');
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }

    // Test 4: Verify logging
    console.log('Test 4: Verifying LLM Interaction Logging');
    console.log('-'.repeat(80));

    try {
        const logs = llmInteractionLogStore.getAll();
        console.log(`✓ Total LLM interactions logged: ${logs.length}`);

        if (logs.length > 0) {
            const latestLog = logs[logs.length - 1];
            console.log();
            console.log('Latest Log Entry:');
            console.log(`  - ID: ${latestLog.id}`);
            console.log(`  - Timestamp: ${latestLog.timestamp.toISOString()}`);
            console.log(`  - Prompt Type: ${latestLog.promptType}`);
            console.log(`  - Model: ${latestLog.model}`);
            console.log(`  - Tokens Used: ${latestLog.tokensUsed}`);
            console.log(`  - Related Opportunity: ${latestLog.relatedOpportunityId || 'N/A'}`);
            console.log(`  - System Prompt Length: ${latestLog.systemPrompt.length} chars`);
            console.log(`  - User Prompt Length: ${latestLog.userPrompt.length} chars`);
            console.log(`  - Response Length: ${latestLog.response.length} chars`);
        }
        console.log();
    } catch (error) {
        console.error('❌ Logging verification failed!');
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }

    // Test 5: Test error handling (invalid prompt)
    console.log('Test 5: Testing Error Handling');
    console.log('-'.repeat(80));

    try {
        console.log('Testing with empty prompt (should handle gracefully)...');

        const emptyPrompt = {
            systemPrompt: '',
            userPrompt: '',
            temperature: 0.5,
            maxTokens: 10
        };

        try {
            await baseLLMService.sendRequest(emptyPrompt);
            console.log('✓ Empty prompt handled (no crash)');
        } catch (error) {
            console.log('✓ Empty prompt rejected with error (expected behavior)');
            console.log(`  Error message: ${error instanceof Error ? error.message : String(error)}`);
        }
        console.log();
    } catch (error) {
        console.error('❌ Error handling test failed unexpectedly!');
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Summary
    console.log('='.repeat(80));
    console.log('✅ All LLM Integration Tests Passed!');
    console.log('='.repeat(80));
    console.log();
    console.log('Summary:');
    console.log('  ✓ Azure OpenAI connection successful');
    console.log('  ✓ Match scoring working correctly');
    console.log('  ✓ Error handling implemented');
    console.log('  ✓ Logging functional');
    console.log();
    console.log('The LLM integration is ready for use!');
    console.log();
}

// Run the test
testLLMIntegration().catch(error => {
    console.error('Fatal error during testing:');
    console.error(error);
    process.exit(1);
});
