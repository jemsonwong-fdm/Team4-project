/**
 * Opportunity Generation API Route - Trigger opportunity detection
 * Requirements: 3.1, 3.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { clientStore } from '@/lib/data/stores';
import { opportunityDetectionService } from '@/lib/services/opportunityDetectionService';
import { opportunityBriefService } from '@/lib/services/opportunityBriefService';
import { accessControlService } from '@/lib/services/accessControlService';

export async function POST(request: NextRequest) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        // Parse request body for options
        const body = await request.json().catch(() => ({}));
        const minScore = body.minScore || 50;
        const concurrency = body.concurrency || 5;

        // Get all clients
        const clients = clientStore.getAll();

        if (clients.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Not enough clients to generate opportunities' },
                { status: 400 }
            );
        }

        console.log(`Starting opportunity generation for ${clients.length} clients...`);

        // Track progress
        let completed = 0;
        let total = 0;

        // Detect opportunities with progress tracking
        const opportunities = await opportunityDetectionService.detectOpportunities(
            clients,
            minScore,
            {
                concurrency,
                onProgress: (completedCount, totalCount) => {
                    completed = completedCount;
                    total = totalCount;
                    console.log(`Progress: ${completed}/${total} pairs evaluated`);
                }
            }
        );

        console.log(`Generated ${opportunities.length} opportunities`);

        // Generate briefs for all opportunities
        console.log('Generating opportunity briefs...');
        for (const opportunity of opportunities) {
            await opportunityBriefService.generateBrief(opportunity);
        }

        // Log the generation action
        await accessControlService.logAccess(
            rm.id,
            'opportunity',
            'generation',
            'create',
            {
                clientCount: clients.length,
                opportunitiesGenerated: opportunities.length,
                minScore,
                concurrency
            }
        );

        return NextResponse.json({
            success: true,
            data: {
                opportunitiesGenerated: opportunities.length,
                clientsAnalyzed: clients.length,
                pairsEvaluated: total,
                minScore
            }
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error generating opportunities:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate opportunities', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
