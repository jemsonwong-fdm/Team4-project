/**
 * Opportunity Detail API Route - Get single opportunity
 * Requirements: 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { opportunityStore } from '@/lib/data/stores';
import { accessControlService } from '@/lib/services/accessControlService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        // Get opportunity ID from params
        const { id } = await params;

        // Retrieve the opportunity
        const opportunity = opportunityStore.read(id);

        if (!opportunity) {
            return NextResponse.json(
                { success: false, error: 'Opportunity not found' },
                { status: 404 }
            );
        }

        // Verify the RM is involved in this opportunity
        if (opportunity.rm1Id !== rm.id && opportunity.rm2Id !== rm.id) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        // Redact client data for cross-RM viewing
        const redactedOpp: any = { ...opportunity };

        // Redact client1 if not owned by current RM
        if (opportunity.client1.rmId !== rm.id) {
            redactedOpp.client1 = accessControlService.redactClientForCrossRMView(opportunity.client1);
        }

        // Redact client2 if not owned by current RM
        if (opportunity.client2.rmId !== rm.id) {
            redactedOpp.client2 = accessControlService.redactClientForCrossRMView(opportunity.client2);
        }

        // Log access
        await accessControlService.logAccess(
            rm.id,
            'opportunity',
            id,
            'read',
            {}
        );

        return NextResponse.json({
            success: true,
            data: redactedOpp
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching opportunity:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch opportunity' },
            { status: 500 }
        );
    }
}
