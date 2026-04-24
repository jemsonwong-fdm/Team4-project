/**
 * Simple logout API route for MVP
 * Requirements: 7.1
 */

import { NextResponse } from 'next/server';
import { clearRMSession } from '@/lib/auth';

/**
 * POST - Logout the current RM
 */
export async function POST() {
    try {
        await clearRMSession();

        return NextResponse.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Error during logout:', error);
        return NextResponse.json(
            { success: false, error: 'Logout failed' },
            { status: 500 }
        );
    }
}
