/**
 * Get current authenticated RM
 * Requirements: 7.1
 */

import { NextResponse } from 'next/server';
import { getCurrentRM } from '@/lib/auth';

/**
 * GET - Get the current authenticated RM
 */
export async function GET() {
    try {
        const rm = await getCurrentRM();

        if (!rm) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            data: rm
        });

    } catch (error) {
        console.error('Error fetching current RM:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch current RM' },
            { status: 500 }
        );
    }
}
