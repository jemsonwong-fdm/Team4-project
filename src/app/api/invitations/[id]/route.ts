/**
 * Invitation Detail API Route - Respond to invitation
 * Requirements: 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { collaborationService } from '@/lib/services/collaborationService';
import { accessControlService } from '@/lib/services/accessControlService';

/**
 * PUT - Respond to an invitation (accept or decline)
 * Requirements: 6.2
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        // Get invitation ID from params
        const { id } = await params;

        // Parse request body
        const body = await request.json();
        const { status } = body;

        // Validate status
        if (!status || (status !== 'accepted' && status !== 'declined')) {
            return NextResponse.json(
                { success: false, error: 'status must be "accepted" or "declined"' },
                { status: 400 }
            );
        }

        // Respond to invitation
        const invitation = await collaborationService.respondToInvitation(id, rm.id, status);

        // Log access
        await accessControlService.logAccess(
            rm.id,
            'invitation',
            id,
            'update',
            { status }
        );

        return NextResponse.json({
            success: true,
            data: invitation
        });

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

            if (error.message.includes('not authorized')) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 403 }
                );
            }

            if (error.message.includes('already been')) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 409 }
                );
            }
        }

        console.error('Error responding to invitation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to respond to invitation', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
