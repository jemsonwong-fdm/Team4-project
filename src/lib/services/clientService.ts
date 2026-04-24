/**
 * Client Management Service
 * Requirements: 1.1, 1.2, 1.5
 */

import { randomUUID } from 'crypto';
import type { Client, ValidationResult } from '../models';
import { validateClient } from '../models';
import { clientStore } from '../data/stores';

/**
 * Service for managing client data with CRUD operations
 */
export class ClientService {
    /**
     * Create a new client with validation
     * Requirement 1.2: Validate all required fields are provided
     */
    async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
        // Validate client data
        const validation = validateClient(clientData as Partial<Client>);
        if (!validation.isValid) {
            throw new Error(`Client validation failed: ${validation.errors.join(', ')}`);
        }

        // Create client with generated ID and timestamps
        const client: Client = {
            ...clientData,
            id: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Store client
        // Requirement 1.5: Persist changes immediately
        return clientStore.create(client);
    }

    /**
     * Update an existing client with RM authorization check
     * Requirement 1.2: Validate updates
     * Requirement 1.5: Persist changes immediately
     */
    async updateClient(
        id: string,
        updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>,
        requestingRmId: string
    ): Promise<Client> {
        // Get existing client
        const existingClient = clientStore.read(id);
        if (!existingClient) {
            throw new Error(`Client with id ${id} not found`);
        }

        // Authorization check: RM can only update their own clients
        if (existingClient.rmId !== requestingRmId) {
            throw new Error(`Unauthorized: RM ${requestingRmId} cannot modify client ${id} managed by RM ${existingClient.rmId}`);
        }

        // Merge updates with existing data
        const updatedData = {
            ...existingClient,
            ...updates,
            updatedAt: new Date()
        };

        // Validate updated data
        const validation = validateClient(updatedData);
        if (!validation.isValid) {
            throw new Error(`Client validation failed: ${validation.errors.join(', ')}`);
        }

        // Update client
        const updated = clientStore.update(id, {
            ...updates,
            updatedAt: new Date()
        });

        if (!updated) {
            throw new Error(`Failed to update client ${id}`);
        }

        return updated;
    }

    /**
     * Get all clients managed by a specific RM
     * Requirement 1.5: Support RM-specific queries
     */
    async getClientsByRM(rmId: string): Promise<Client[]> {
        return clientStore.getByRM(rmId);
    }

    /**
     * Get a single client by ID
     * Requirement 1.1: Support client data retrieval
     */
    async getClientById(id: string): Promise<Client | undefined> {
        return clientStore.read(id);
    }

    /**
     * Get all clients in the system
     * Requirement 1.1: Support client data retrieval
     */
    async getAllClients(): Promise<Client[]> {
        return clientStore.getAll();
    }

    /**
     * Validate client data without creating/updating
     */
    validateClientData(client: Partial<Client>): ValidationResult {
        return validateClient(client);
    }

    /**
     * Delete a client (for completeness, though not in requirements)
     */
    async deleteClient(id: string, requestingRmId: string): Promise<boolean> {
        const existingClient = clientStore.read(id);
        if (!existingClient) {
            throw new Error(`Client with id ${id} not found`);
        }

        // Authorization check
        if (existingClient.rmId !== requestingRmId) {
            throw new Error(`Unauthorized: RM ${requestingRmId} cannot delete client ${id} managed by RM ${existingClient.rmId}`);
        }

        return clientStore.delete(id);
    }
}

// Export singleton instance
export const clientService = new ClientService();

