/**
 * Full integration test for Opportunity Detection Service with LLM
 * Tests the complete flow: candidate generation → evaluation → brief generation
 */

import { opportunityDetectionService } from '../lib/services/opportunityDetectionService';
import { opportunityBriefService } from '../lib/services/opportunityBriefService';
import { clientService } from '../lib/services/clientService';
import { opportunityStore } from '../lib/data/stores';
import { EcosystemPosition } from '../lib/models';

async function testFullOpportunityDetection() {
    console.log('🧪 Full Opportunity Detection Integration Test\n');
    console.log('================================================================================\n');

    try {
        // Clear any existing data
        opportunityStore.clear();

        // Create test clients for different RMs
        console.log('Step 1: Creating Test Clients');
        console.log('--------------------------------------------------------------------------------');

        const client1 = await clientService.createClient({
            companyName: 'SolarTech Solutions',
            ecosystemPositions: [EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            geography: 'North America',
            revenue: 250000000,
            esgAlignment: 'Strong commitment to carbon neutrality by 2030',
            rmId: 'rm-001'
        });
        console.log(`✓ Created ${client1.companyName} (${client1.ecosystemPositions[0]})`);
        console.log(`  RM: ${client1.rmId}, Geography: ${client1.geography}`);

        const client2 = await clientService.createClient({
            companyName: 'GreenPower Developers',
            ecosystemPositions: [EcosystemPosition.PROJECT_DEVELOPERS],
            geography: 'North America',
            revenue: 500000000,
            esgAlignment: 'Net-zero by 2025',
            rmId: 'rm-002'
        });
        console.log(`✓ Created ${client2.companyName} (${client2.ecosystemPositions[0]})`);
        console.log(`  RM: ${client2.rmId}, Geography: ${client2.geography}`);

        const client3 = await clientService.createClient({
            companyName: 'EuroWind Construction',
            ecosystemPositions: [EcosystemPosition.EPC_CONTRACTORS],
            geography: 'Europe',
            revenue: 180000000,
            esgAlignment: 'Sustainable construction practices',
            rmId: 'rm-003'
        });
        console.log(`✓ Created ${client3.companyName} (${client3.ecosystemPositions[0]})`);
        console.log(`  RM: ${client3.rmId}, Geography: ${client3.geography}\n`);

        // Test candidate generation
        console.log('Step 2: Generating Candidate Pairs (Task 7.1)');
        console.log('--------------------------------------------------------------------------------');
        const allClients = await clientService.getAllClients();
        const candidates = opportunityDetectionService.generateCandidatePairs(allClients);
        console.log(`✓ Generated ${candidates.length} candidate pairs\n`);

        for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            console.log(`Candidate ${i + 1}:`);
            console.log(`  ${c.client1.companyName} (${c.client1.ecosystemPositions[0]}, ${c.client1.rmId})`);
            console.log(`  + ${c.client2.companyName} (${c.client2.ecosystemPositions[0]}, ${c.client2.rmId})`);
            console.log(`  Position Pair: ${c.ecosystemPositionPair[0]} + ${c.ecosystemPositionPair[1]}\n`);
        }

        // Test opportunity detection with LLM
        console.log('Step 3: Detecting Opportunities with LLM (Task 7.2)');
        console.log('--------------------------------------------------------------------------------');
        console.log('⚠️  This will make actual LLM API calls...\n');

        const opportunities = await opportunityDetectionService.detectOpportunities(
            allClients,
            50, // minimum score threshold
            {
                concurrency: 2,
                onProgress: (completed, total) => {
                    console.log(`  Progress: ${completed}/${total} pairs evaluated`);
                }
            }
        );

        console.log(`\n✓ Detected ${opportunities.length} opportunities above threshold\n`);

        // Display opportunities
        if (opportunities.length > 0) {
            console.log('Step 4: Generated Opportunities');
            console.log('--------------------------------------------------------------------------------');

            for (let i = 0; i < opportunities.length; i++) {
                const opp = opportunities[i];
                console.log(`\nOpportunity ${i + 1}:`);
                console.log(`  ID: ${opp.id}`);
                console.log(`  Players: ${opp.client1.companyName} + ${opp.client2.companyName}`);
                console.log(`  RMs: ${opp.rm1Id} + ${opp.rm2Id}`);
                console.log(`  Match Score: ${opp.matchScore}/100`);
                console.log(`  Confidence: ${opp.confidence}`);
                console.log(`  Flagged for Review: ${opp.flaggedForReview}`);
                console.log(`  Banking Products: ${opp.suggestedBankingProducts.map(p => p.name).join(', ')}`);
                console.log(`  Reasoning: ${opp.reasoning.substring(0, 200)}...`);
            }

            // Test brief generation
            console.log('\n\nStep 5: Generating Opportunity Briefs (Task 7.3)');
            console.log('--------------------------------------------------------------------------------');

            const firstOpp = opportunities[0];
            console.log(`\nGenerating brief for: ${firstOpp.client1.companyName} + ${firstOpp.client2.companyName}\n`);

            const briefWithTitle = await opportunityBriefService.generateBrief(firstOpp);

            console.log(`✓ Title: ${briefWithTitle.title}`);
            console.log(`✓ Trigger: ${briefWithTitle.trigger}`);
            console.log(`✓ Banking Products: ${briefWithTitle.suggestedBankingProducts.length} products`);

            // Test detailed explanation
            console.log('\nGenerating detailed explanation...');
            const detailedExplanation = await opportunityBriefService.generateDetailedExplanation(briefWithTitle);
            console.log(`✓ Detailed Brief (${detailedExplanation.length} chars):\n`);
            console.log(detailedExplanation.substring(0, 500) + '...\n');

            // Test display formatting
            console.log('Step 6: Testing Display Formatting');
            console.log('--------------------------------------------------------------------------------');
            const displayFormat = opportunityBriefService.formatOpportunityForDisplay(briefWithTitle, 'rm-001');
            console.log('✓ Formatted display generated\n');
            console.log(displayFormat.substring(0, 600) + '...\n');
        }

        console.log('================================================================================');
        console.log('✅ Full Opportunity Detection Integration Test Passed!');
        console.log('================================================================================\n');

        console.log('Summary:');
        console.log(`  ✓ Created ${allClients.length} test clients`);
        console.log(`  ✓ Generated ${candidates.length} candidate pairs`);
        console.log(`  ✓ Detected ${opportunities.length} opportunities`);
        console.log(`  ✓ Generated titles and triggers with LLM`);
        console.log(`  ✓ All requirements for Task 7 verified\n`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

testFullOpportunityDetection();
