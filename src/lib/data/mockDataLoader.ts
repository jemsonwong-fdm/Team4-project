/**
 * Mock data loader utility
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import clientsJson from '@/data/mock/clients.json';
import rmsJson from '@/data/mock/rms.json';

import type { Client, EcosystemPosition, RM } from '../models';
import { validateClient } from '../models';
import {
    auditLogStore,
    clientStore,
    invitationStore,
    llmInteractionLogStore,
    opportunityStore
} from './stores';

export type DataMode = 'mock' | 'production';

type MockRMRecord = {
    id: string;
    name: string;
    segment: string;
};

type MockClientRecord = {
    id: string;
    companyName: string;
    ecosystemPositions: string[];
    geography: string;
    revenue: number;
    esgAlignment: string;
    rmId: string;
};

export interface MockDataLoadResult {
    mode: DataMode;
    rmsLoaded: number;
    clientsLoaded: number;
    skippedClients: number;
    errors: string[];
    rms: RM[];
    clients: Client[];
}

const DEFAULT_DATA_MODE: DataMode =
    process.env.NEXT_PUBLIC_DATA_MODE?.toLowerCase() === 'production' ? 'production' : 'mock';

let currentDataMode: DataMode = DEFAULT_DATA_MODE;

/**
 * Current data mode indicator (mock vs production)
 * Requirement 9.4
 */
export function getDataMode(): DataMode {
    return currentDataMode;
}

/**
 * Set active data mode
 * Requirement 9.5
 */
export function setDataMode(mode: DataMode): DataMode {
    currentDataMode = mode;
    return currentDataMode;
}

/**
 * Clear all in-memory stores
 */
export function clearInMemoryData(): void {
    clientStore.clear();
    opportunityStore.clear();
    invitationStore.clear();
    auditLogStore.clear();
    llmInteractionLogStore.clear();
}

/**
 * Switch between data modes with optional store reset
 * Requirement 9.5
 */
export async function switchDataMode(
    mode: DataMode,
    options: { clearExisting?: boolean } = {}
): Promise<MockDataLoadResult> {
    setDataMode(mode);

    if (mode === 'mock') {
        return loadMockData({ clearExisting: options.clearExisting ?? true, mode });
    }

    if (options.clearExisting ?? true) {
        clearInMemoryData();
    }

    return {
        mode,
        rmsLoaded: 0,
        clientsLoaded: 0,
        skippedClients: 0,
        errors: [],
        rms: [],
        clients: []
    };
}

/**
 * Load mock RM and client data into in-memory stores
 * Requirement 9.1, 9.2, 9.3
 */
export async function loadMockData(
    options: { clearExisting?: boolean; mode?: DataMode } = {}
): Promise<MockDataLoadResult> {
    if (options.mode) {
        setDataMode(options.mode);
    }

    if (currentDataMode !== 'mock') {
        return {
            mode: currentDataMode,
            rmsLoaded: 0,
            clientsLoaded: 0,
            skippedClients: 0,
            errors: ['Mock data loading skipped because data mode is set to production'],
            rms: [],
            clients: []
        };
    }

    if (options.clearExisting ?? true) {
        clearInMemoryData();
    }

    const rms = (rmsJson as MockRMRecord[]).map((rm) => ({
        id: rm.id,
        name: rm.name,
        segment: rm.segment
    }));

    const validRmIds = new Set(rms.map((rm) => rm.id));
    const errors: string[] = [];
    const loadedClients: Client[] = [];

    for (const rawClient of clientsJson as MockClientRecord[]) {
        if (!validRmIds.has(rawClient.rmId)) {
            errors.push(`Client ${rawClient.id} skipped: rmId ${rawClient.rmId} does not exist`);
            continue;
        }

        const now = new Date();
        const client: Client = {
            id: rawClient.id,
            companyName: rawClient.companyName,
            ecosystemPositions: rawClient.ecosystemPositions as EcosystemPosition[],
            geography: rawClient.geography,
            revenue: rawClient.revenue,
            esgAlignment: rawClient.esgAlignment,
            rmId: rawClient.rmId,
            createdAt: now,
            updatedAt: now
        };

        const validation = validateClient(client);
        if (!validation.isValid) {
            errors.push(
                `Client ${rawClient.id} skipped: ${validation.errors.join(', ')}`
            );
            continue;
        }

        clientStore.create(client);
        loadedClients.push(client);
    }

    return {
        mode: currentDataMode,
        rmsLoaded: rms.length,
        clientsLoaded: loadedClients.length,
        skippedClients: (clientsJson as MockClientRecord[]).length - loadedClients.length,
        errors,
        rms,
        clients: loadedClients
    };
}
