/**
 * Validation functions for data models
 */

import type { Client, Opportunity, Invitation, AuditLogEntry, LLMInteractionLog, ValidationResult } from './index';
import { EcosystemPosition } from './index';

/**
 * Validates client data according to requirements 1.1, 1.2, 1.3
 */
export function validateClient(client: Partial<Client>): ValidationResult {
    const errors: string[] = [];

    // Requirement 1.2: Validate all required fields are provided
    if (!client.companyName || client.companyName.trim() === '') {
        errors.push('companyName is required and must be non-empty');
    }

    if (!client.ecosystemPositions || client.ecosystemPositions.length === 0) {
        errors.push('ecosystemPositions must contain at least one position');
    } else {
        // Validate all positions are valid enum values
        const validPositions = Object.values(EcosystemPosition);
        for (const position of client.ecosystemPositions) {
            if (!validPositions.includes(position)) {
                errors.push(`Invalid ecosystem position: ${position}`);
            }
        }
    }

    if (!client.geography || client.geography.trim() === '') {
        errors.push('geography is required and must be non-empty');
    }

    if (client.revenue === undefined || client.revenue === null) {
        errors.push('revenue is required');
    } else if (client.revenue < 0) {
        errors.push('revenue must be non-negative');
    }

    if (!client.esgAlignment || client.esgAlignment.trim() === '') {
        errors.push('esgAlignment is required and must be non-empty');
    }

    // Requirement 1.3: Client must have exactly one non-empty rmId
    if (!client.rmId || client.rmId.trim() === '') {
        errors.push('rmId is required and must be non-empty');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates opportunity data
 */
export function validateOpportunity(opportunity: Partial<Opportunity>): ValidationResult {
    const errors: string[] = [];

    if (!opportunity.title || opportunity.title.trim() === '') {
        errors.push('title is required and must be non-empty');
    }

    if (!opportunity.client1) {
        errors.push('client1 is required');
    }

    if (!opportunity.client2) {
        errors.push('client2 is required');
    }

    // Requirement 3.4: Cross-RM constraint
    if (opportunity.client1 && opportunity.client2) {
        if (opportunity.client1.rmId === opportunity.client2.rmId) {
            errors.push('client1.rmId must not equal client2.rmId (cross-RM requirement)');
        }
    }

    if (!opportunity.rm1Id || opportunity.rm1Id.trim() === '') {
        errors.push('rm1Id is required and must be non-empty');
    }

    if (!opportunity.rm2Id || opportunity.rm2Id.trim() === '') {
        errors.push('rm2Id is required and must be non-empty');
    }

    if (!opportunity.trigger || opportunity.trigger.trim() === '') {
        errors.push('trigger is required and must be non-empty');
    }

    if (!opportunity.suggestedBankingProducts || opportunity.suggestedBankingProducts.length === 0) {
        errors.push('suggestedBankingProducts must contain at least one product');
    }

    if (opportunity.matchScore === undefined || opportunity.matchScore === null) {
        errors.push('matchScore is required');
    } else if (opportunity.matchScore < 0 || opportunity.matchScore > 100) {
        errors.push('matchScore must be between 0 and 100');
    }

    if (!opportunity.reasoning || opportunity.reasoning.trim() === '') {
        errors.push('reasoning is required and must be non-empty');
    }

    if (!opportunity.confidence || !['high', 'medium', 'low'].includes(opportunity.confidence)) {
        errors.push('confidence must be one of: high, medium, low');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates invitation data
 */
export function validateInvitation(invitation: Partial<Invitation>): ValidationResult {
    const errors: string[] = [];

    if (!invitation.opportunityId || invitation.opportunityId.trim() === '') {
        errors.push('opportunityId is required and must be non-empty');
    }

    if (!invitation.senderRmId || invitation.senderRmId.trim() === '') {
        errors.push('senderRmId is required and must be non-empty');
    }

    if (!invitation.recipientRmId || invitation.recipientRmId.trim() === '') {
        errors.push('recipientRmId is required and must be non-empty');
    }

    // Requirement 6.1: Sender and recipient must be different
    if (invitation.senderRmId && invitation.recipientRmId &&
        invitation.senderRmId === invitation.recipientRmId) {
        errors.push('senderRmId must not equal recipientRmId');
    }

    if (!invitation.status || !['pending', 'accepted', 'declined'].includes(invitation.status)) {
        errors.push('status must be one of: pending, accepted, declined');
    }

    if (!invitation.sentAt) {
        errors.push('sentAt is required');
    }

    // Validate respondedAt is after sentAt if present
    if (invitation.respondedAt && invitation.sentAt) {
        if (invitation.respondedAt < invitation.sentAt) {
            errors.push('respondedAt must be after sentAt');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates audit log entry data
 */
export function validateAuditLogEntry(entry: Partial<AuditLogEntry>): ValidationResult {
    const errors: string[] = [];

    if (!entry.timestamp) {
        errors.push('timestamp is required');
    }

    if (!entry.rmId || entry.rmId.trim() === '') {
        errors.push('rmId is required and must be non-empty');
    }

    if (!entry.action || entry.action.trim() === '') {
        errors.push('action is required and must be non-empty');
    }

    if (!entry.resourceType || entry.resourceType.trim() === '') {
        errors.push('resourceType is required and must be non-empty');
    }

    if (!entry.resourceId || entry.resourceId.trim() === '') {
        errors.push('resourceId is required and must be non-empty');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates LLM interaction log data
 */
export function validateLLMInteractionLog(log: Partial<LLMInteractionLog>): ValidationResult {
    const errors: string[] = [];

    if (!log.timestamp) {
        errors.push('timestamp is required');
    }

    if (!log.promptType || log.promptType.trim() === '') {
        errors.push('promptType is required and must be non-empty');
    }

    if (!log.systemPrompt || log.systemPrompt.trim() === '') {
        errors.push('systemPrompt is required and must be non-empty');
    }

    if (!log.userPrompt || log.userPrompt.trim() === '') {
        errors.push('userPrompt is required and must be non-empty');
    }

    if (!log.response || log.response.trim() === '') {
        errors.push('response is required and must be non-empty');
    }

    if (!log.model || log.model.trim() === '') {
        errors.push('model is required and must be non-empty');
    }

    if (log.tokensUsed === undefined || log.tokensUsed === null) {
        errors.push('tokensUsed is required');
    } else if (log.tokensUsed < 0) {
        errors.push('tokensUsed must be non-negative');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
