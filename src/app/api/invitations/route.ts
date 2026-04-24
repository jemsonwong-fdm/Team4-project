/**
 * Invitations API Route - Send and list invitations
 * Requirements: 6.1, 6.2, 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { collaborationService } from '@/lib/services/collaborationService';
import { accessControlService } from '@/lib/services/accessControlService';

/**
 * POST - Send an invitation to another RM
 * Requirements: 6.1
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        // Parse request body
        const body = await request.json();
        const { opportunityId } = body;

        if (!opportunityId) {
            return NextResponse.json(
                { success: false, error: 'opportunityId is required' },
                { status: 400 }
            );
        }

        // Send invitation
        const invitation = await collaborationService.sendInvitation(opportunityId, rm.id);

        // Log access
        await accessControlService.logAccess(
            rm.id,
            'invitation',
            invitation.id,
            'create',
            { opportunityId }
        );

        return NextResponse.json({
            success: true,
            data: invitation
        }, { status: 201 });

    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (error instanceof Error) {
            // Handle specific errors
            if (error.message.includes('not found')) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 404 }
                );
            }

            if (error.message.includes('not involved') || error.message.includes('not authorized')) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 403 }
                );
            }

            if (error.message.includes('duplicate') || error.message.includes('already exists')) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 409 }
                );
            }
        }

        console.error('Error sending invitation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send invitation', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET - List invitations for the authenticated RM
 * Requirements: 6.2, 6.5
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type'); // 'received', 'sent', or 'all' (default)

        let invitations;

        if (type === 'received') {
            invitations = await collaborationService.getReceivedInvitations(rm.id);
        } else if (type === 'sent') {
            invitations = await collaborationService.getSentInvitations(rm.id);
        } else {
            invitations = await collaborationService.getInvitationsForRM(rm.id);
        }

        // Redact client data in opportunities for cross-RM viewing
        const redactedInvitations = invitations.map(inv => {
            if (!inv.opportunity) {
                return inv;
            }

            const redactedInv: any = { ...inv };
            const opp = inv.opportunity;

            // Redact client1 if not owned by current RM
            if (opp.client1.rmId !== rm.id) {
                redactedInv.opportunity = {
                    ...opp,
                    client1: accessControlService.redactClientForCrossRMView(opp.client1)
                };
            }

            // Redact client2 if not owned by current RM
            if (opp.client2.rmId !== rm.id) {
                redactedInv.opportunity = {
                    ...redactedInv.opportunity!,
                    client2: accessControlService.redactClientForCrossRMView(opp.client2)
                };
            }

            return redactedInv;
        });

        // Log access
        await accessControlService.logAccess(
            rm.id,
            'invitation',
            'list',
            'read',
            { type, count: redactedInvitations.length }
        );

        return NextResponse.json({
            success: true,
            data: redactedInvitations,
            count: redactedInvitations.length
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching invitations:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invitations' },
            { status: 500 }
        );
    }
}
