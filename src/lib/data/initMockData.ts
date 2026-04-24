/**
 * Initialize mock data on server startup
 * Requirements: 9.1, 9.4
 */

import { loadMockData, getDataMode } from './mockDataLoader';

let isInitialized = false;

/**
 * Initialize mock data if in mock mode and not already initialized
 * This runs once on server startup
 */
export async function initializeMockData(): Promise<void> {
    if (isInitialized) {
        return;
    }

    const mode = getDataMode();

    if (mode === 'mock') {
        console.log('[Mock Data] Initializing mock data on startup...');
        try {
            const result = await loadMockData({ clearExisting: true });
            console.log(`[Mock Data] Loaded ${result.clientsLoaded} clients and ${result.rmsLoaded} RMs`);
            if (result.errors.length > 0) {
                console.warn('[Mock Data] Errors during loading:', result.errors);
            }
            isInitialized = true;
        } catch (error) {
            console.error('[Mock Data] Failed to initialize mock data:', error);
        }
    } else {
        console.log('[Mock Data] Skipping mock data initialization (production mode)');
        isInitialized = true;
    }
}

/**
 * Reset initialization flag (useful for testing)
 */
export function resetInitialization(): void {
    isInitialized = false;
}
