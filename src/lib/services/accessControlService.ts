/**
 * Access Control Service
 * Requirements: 1.4, 7.2, 7.3, 7.4, 7.5
 */

import { randomUUID } from 'crypto';
import type { Client, AuditLogEntry } from '../models';
import { clientStore, auditLogStore } from '../data/stores';

/**
 * Redacted client view for cross-RM viewing
 * Only includes company name and ecosystem positions
 */
export interface RedactedClient {
    id: string;
    companyName: string;
    ecosystemPositions: Client['ecosystemPositions'];
}

/**
 * Service for managing access control and data privacy
 */
export class AccessControlService {
    /**
     * Check if an RM can access a client's data
     * Requirement 7.2: RMs can only access full details of their own clients
     */
    async canAccessClient(rmId: string, clientId: string): Promise<boolean> {
        const client = clientStore.read(clientId);
        if (!client) {
            return false;
        }

        // RM can access their own clients
        return client.rmId === rmId;
    }

    /**
     * Check if an RM can modify a client's data
     * Requirement 7.5: Prevent unauthorized modification
     */
    async canModifyClient(rmId: string, clientId: string): Promise<boolean> {
        const client = clientStore.read(clientId);
        if (!client) {
            return false;
        }

        // RM can only modify their own clients
        return client.rmId === rmId;
    }

    /**
     * Redact client data for cross-RM viewing
     * Requirement 1.4, 7.3: Show limited information for clients managed by other RMs
     * Only reveals company name and ecosystem position
     */
    redactClientForCrossRMView(client: Client): RedactedClient {
        return {
            id: client.id,
            companyName: client.companyName,
            ecosystemPositions: client.ecosystemPositions
        };
    }

    /**
     * Get client data with appropriate access control
     * Returns full data if RM owns the client, redacted data otherwise
     */
    async getClientWithAccessControl(
        clientId: string,
        requestingRmId: string
    ): Promise<Client | RedactedClient | undefined> {
        const client = clientStore.read(clientId);
        if (!client) {
            return undefined;
        }

        // Log the access
        await this.logAccess(requestingRmId, 'client', clientId, 'read');

        // Return full data if RM owns the client
        if (client.rmId === requestingRmId) {
            return client;
        }

        // Return redacted data for cross-RM viewing
        return this.redactClientForCrossRMView(client);
    }

    /**
     * Log access to client data for audit purposes
     * Requirement 7.4: Log all access to client data
     */
    async logAccess(
        rmId: string,
        resourceType: string,
        resourceId: string,
        action: string,
        details: Record<string, any> = {}
    ): Promise<AuditLogEntry> {
        const logEntry: AuditLogEntry = {
            id: randomUUID(),
            timestamp: new Date(),
            rmId,
            action,
            resourceType,
            resourceId,
            details
        };

        return auditLogStore.create(logEntry);
    }

    /**
     * Get audit logs for a specific RM
     */
    async getAuditLogsByRM(rmId: string): Promise<AuditLogEntry[]> {
        return auditLogStore.getByRM(rmId);
    }

    /**
     * Get audit logs for a specific resource
     */
    async getAuditLogsByResource(
        resourceType: string,
        resourceId: string
    ): Promise<AuditLogEntry[]> {
        return auditLogStore.getByResource(resourceType, resourceId);
    }

    /**
     * Get all audit logs sorted by timestamp
     */
    async getAllAuditLogs(): Promise<AuditLogEntry[]> {
        return auditLogStore.getAllSorted();
    }

    /**
     * Verify RM authorization and throw error if unauthorized
     * Helper method for services to enforce access control
     */
    async verifyClientAccess(rmId: string, clientId: string, action: 'read' | 'modify'): Promise<void> {
        const canAccess = action === 'modify'
            ? await this.canModifyClient(rmId, clientId)
            : await this.canAccessClient(rmId, clientId);

        if (!canAccess) {
            // Log unauthorized access attempt
            await this.logAccess(rmId, 'client', clientId, `unauthorized_${action}_attempt`);
            throw new Error(`Unauthorized: RM ${rmId} cannot ${action} client ${clientId}`);
        }

        // Log successful authorization check
        await this.logAccess(rmId, 'client', clientId, `authorized_${action}`);
    }
}

// Export singleton instance
export const accessControlService = new AccessControlService();

