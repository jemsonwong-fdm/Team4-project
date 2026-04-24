/**
 * Mock Data Loading API Route
 * Requirements: 9.1, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { loadMockData, getDataMode, switchDataMode } from '@/lib/data/mockDataLoader';
import { accessControlService } from '@/lib/services/accessControlService';

/**
 * POST - Load mock data into the system
 * Requirements: 9.1, 9.4
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        // Parse request body for options
        const body = await request.json().catch(() => ({}));
        const clearExisting = body.clearExisting !== false; // Default to true
        const mode = body.mode || 'mock';

        console.log(`Loading mock data (clearExisting: ${clearExisting}, mode: ${mode})...`);

        // Load mock data
        let result;
        if (mode !== getDataMode()) {
            // Switch mode if different
            result = await switchDataMode(mode, { clearExisting });
        } else {
            // Just load data in current mode
            result = await loadMockData({ clearExisting, mode });
        }

        // Log the action
        await accessControlService.logAccess(
            rm.id,
            'mock-data',
            'load',
            'create',
            {
                mode: result.mode,
                rmsLoaded: result.rmsLoaded,
                clientsLoaded: result.clientsLoaded,
                skippedClients: result.skippedClients,
                clearExisting
            }
        );

        console.log(`Mock data loaded: ${result.clientsLoaded} clients, ${result.rmsLoaded} RMs`);

        return NextResponse.json({
            success: true,
            data: {
                mode: result.mode,
                rmsLoaded: result.rmsLoaded,
                clientsLoaded: result.clientsLoaded,
                skippedClients: result.skippedClients,
                errors: result.errors
            }
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error loading mock data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load mock data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET - Get current data mode and statistics
 * Requirements: 9.4
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate the RM (Requirement 7.1)
        const rm = await requireAuth();

        const mode = getDataMode();

        return NextResponse.json({
            success: true,
            data: {
                mode,
                isMockMode: mode === 'mock'
            }
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error getting data mode:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get data mode' },
            { status: 500 }
        );
    }
}
