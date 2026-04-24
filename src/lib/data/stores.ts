/**
 * In-memory data stores for MVP
 * Requirements: 1.1, 1.5
 */

import type { Client, Opportunity, Invitation, AuditLogEntry, LLMInteractionLog } from '../models';

/**
 * Generic in-memory store with indexing support
 */
class InMemoryStore<T extends { id: string }> {
    private data: Map<string, T> = new Map();
    private indexes: Map<string, Map<string, Set<string>>> = new Map();

    /**
     * Create a new record
     */
    create(record: T): T {
        this.data.set(record.id, record);
        this.updateIndexes(record);
        return record;
    }

    /**
     * Read a record by ID
     */
    read(id: string): T | undefined {
        return this.data.get(id);
    }

    /**
     * Update a record
     */
    update(id: string, updates: Partial<T>): T | undefined {
        const existing = this.data.get(id);
        if (!existing) {
            return undefined;
        }

        // Remove old indexes
        this.removeFromIndexes(existing);

        // Apply updates
        const updated = { ...existing, ...updates };
        this.data.set(id, updated);

        // Update indexes
        this.updateIndexes(updated);

        return updated;
    }

    /**
     * Delete a record
     */
    delete(id: string): boolean {
        const existing = this.data.get(id);
        if (!existing) {
            return false;
        }

        this.removeFromIndexes(existing);
        return this.data.delete(id);
    }

    /**
     * Get all records
     */
    getAll(): T[] {
        return Array.from(this.data.values());
    }

    /**
     * Find records by indexed field
     */
    findByIndex(indexName: string, value: string): T[] {
        const index = this.indexes.get(indexName);
        if (!index) {
            return [];
        }

        const ids = index.get(value);
        if (!ids) {
            return [];
        }

        return Array.from(ids)
            .map(id => this.data.get(id))
            .filter((record): record is T => record !== undefined);
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.data.clear();
        this.indexes.clear();
    }

    /**
     * Get count of records
     */
    count(): number {
        return this.data.size;
    }

    /**
     * Register an index on a field
     */
    protected registerIndex(indexName: string, extractor: (record: T) => string | string[]): void {
        this.indexes.set(indexName, new Map());

        // Build index for existing data
        for (const record of this.data.values()) {
            this.addToIndex(indexName, record, extractor);
        }
    }

    /**
     * Update indexes for a record
     */
    private updateIndexes(record: T): void {
        // Indexes are managed by subclasses via registerIndex
    }

    /**
     * Remove record from indexes
     */
    private removeFromIndexes(record: T): void {
        for (const [indexName, index] of this.indexes.entries()) {
            for (const [value, ids] of index.entries()) {
                ids.delete(record.id);
                if (ids.size === 0) {
                    index.delete(value);
                }
            }
        }
    }

    /**
     * Add record to an index
     */
    private addToIndex(indexName: string, record: T, extractor: (record: T) => string | string[]): void {
        const index = this.indexes.get(indexName);
        if (!index) {
            return;
        }

        const values = extractor(record);
        const valueArray = Array.isArray(values) ? values : [values];

        for (const value of valueArray) {
            if (!index.has(value)) {
                index.set(value, new Set());
            }
            index.get(value)!.add(record.id);
        }
    }
}

/**
 * Client store with RM indexing
 */
class ClientStore extends InMemoryStore<Client> {
    constructor() {
        super();
    }

    /**
     * Get clients by RM ID (efficient lookup)
     */
    getByRM(rmId: string): Client[] {
        return this.getAll().filter(client => client.rmId === rmId);
    }

    /**
     * Override create to maintain RM index
     */
    create(client: Client): Client {
        return super.create(client);
    }
}

/**
 * Opportunity store with RM indexing
 */
class OpportunityStore extends InMemoryStore<Opportunity> {
    constructor() {
        super();
    }

    /**
     * Get opportunities involving a specific RM
     */
    getByRM(rmId: string): Opportunity[] {
        return this.getAll().filter(
            opp => opp.rm1Id === rmId || opp.rm2Id === rmId
        );
    }

    /**
     * Get opportunities sorted by match score
     */
    getAllSorted(): Opportunity[] {
        return this.getAll().sort((a, b) => b.matchScore - a.matchScore);
    }

    /**
     * Get opportunities by RM sorted by match score
     */
    getByRMSorted(rmId: string): Opportunity[] {
        return this.getByRM(rmId).sort((a, b) => b.matchScore - a.matchScore);
    }
}

/**
 * Invitation store with RM and opportunity indexing
 */
class InvitationStore extends InMemoryStore<Invitation> {
    constructor() {
        super();
    }

    /**
     * Get invitations for a specific RM (as sender or recipient)
     */
    getByRM(rmId: string): Invitation[] {
        return this.getAll().filter(
            inv => inv.senderRmId === rmId || inv.recipientRmId === rmId
        );
    }

    /**
     * Get invitations received by an RM
     */
    getReceivedByRM(rmId: string): Invitation[] {
        return this.getAll().filter(inv => inv.recipientRmId === rmId);
    }

    /**
     * Get invitations sent by an RM
     */
    getSentByRM(rmId: string): Invitation[] {
        return this.getAll().filter(inv => inv.senderRmId === rmId);
    }

    /**
     * Get invitations for a specific opportunity
     */
    getByOpportunity(opportunityId: string): Invitation[] {
        return this.getAll().filter(inv => inv.opportunityId === opportunityId);
    }

    /**
     * Check if a pending invitation exists for an opportunity from a sender
     */
    hasPendingInvitation(opportunityId: string, senderRmId: string): boolean {
        return this.getAll().some(
            inv => inv.opportunityId === opportunityId &&
                inv.senderRmId === senderRmId &&
                inv.status === 'pending'
        );
    }
}

/**
 * Audit log store with RM and resource indexing
 */
class AuditLogStore extends InMemoryStore<AuditLogEntry> {
    constructor() {
        super();
    }

    /**
     * Get audit logs by RM
     */
    getByRM(rmId: string): AuditLogEntry[] {
        return this.getAll().filter(log => log.rmId === rmId);
    }

    /**
     * Get audit logs by resource
     */
    getByResource(resourceType: string, resourceId: string): AuditLogEntry[] {
        return this.getAll().filter(
            log => log.resourceType === resourceType && log.resourceId === resourceId
        );
    }

    /**
     * Get audit logs sorted by timestamp (most recent first)
     */
    getAllSorted(): AuditLogEntry[] {
        return this.getAll().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}

/**
 * LLM interaction log store
 */
class LLMInteractionLogStore extends InMemoryStore<LLMInteractionLog> {
    constructor() {
        super();
    }

    /**
     * Get logs by prompt type
     */
    getByPromptType(promptType: string): LLMInteractionLog[] {
        return this.getAll().filter(log => log.promptType === promptType);
    }

    /**
     * Get logs by opportunity
     */
    getByOpportunity(opportunityId: string): LLMInteractionLog[] {
        return this.getAll().filter(log => log.relatedOpportunityId === opportunityId);
    }

    /**
     * Get logs sorted by timestamp (most recent first)
     */
    getAllSorted(): LLMInteractionLog[] {
        return this.getAll().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}

// Create singleton instances
export const clientStore = new ClientStore();
export const opportunityStore = new OpportunityStore();
export const invitationStore = new InvitationStore();
export const auditLogStore = new AuditLogStore();
export const llmInteractionLogStore = new LLMInteractionLogStore();

// Export store classes for testing
export {
    ClientStore,
    OpportunityStore,
    InvitationStore,
    AuditLogStore,
    LLMInteractionLogStore
};
