/**
 * Simple login API route for MVP testing
 * Requirements: 7.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRM, getAllRMs } from '@/lib/auth';

/**
 * POST - Login as an RM (for MVP testing)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { rmId } = body;

        if (!rmId) {
            return NextResponse.json(
                { success: false, error: 'rmId is required' },
                { status: 400 }
            );
        }

        // Authenticate the RM
        const rm = await authenticateRM(rmId);

        if (!rm) {
            return NextResponse.json(
                { success: false, error: 'Invalid RM ID' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                rm,
                message: 'Login successful'
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET - Get all available RMs (for testing/login UI)
 */
export async function GET() {
    try {
        const rms = getAllRMs();

        return NextResponse.json({
            success: true,
            data: rms
        });

    } catch (error) {
        console.error('Error fetching RMs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch RMs' },
            { status: 500 }
        );
    }
}
