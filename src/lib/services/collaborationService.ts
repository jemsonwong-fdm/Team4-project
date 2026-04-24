/**
 * RM Collaboration Service
 * Handles invitation management for cross-RM opportunities
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { randomUUID } from 'crypto';
import type { Invitation, Opportunity } from '../models';
import { validateInvitation } from '../models/validation';
import { invitationStore, opportunityStore, auditLogStore } from '../data/stores';

/**
 * Service for managing RM collaboration through invitations
 */
export class CollaborationService {
    /**
     * Send an invitation to another RM for an opportunity
     * Requirements: 6.1, 6.3, 6.4
     * 
     * @param opportunityId - ID of the opportunity
     * @param senderRmId - ID of the RM sending the invitation
     * @returns The created invitation
     * @throws Error if opportunity not found, sender not involved, or duplicate invitation exists
     */
    async sendInvitation(opportunityId: string, senderRmId: string): Promise<Invitation> {
        // Validate opportunity exists
        const opportunity = opportunityStore.read(opportunityId);
        if (!opportunity) {
            throw new Error(`Opportunity not found: ${opportunityId}`);
        }

        // Validate sender is involved in the opportunity
        if (opportunity.rm1Id !== senderRmId && opportunity.rm2Id !== senderRmId) {
            throw new Error(`RM ${senderRmId} is not involved in opportunity ${opportunityId}`);
        }

        // Determine recipient RM (the other RM in the opportunity)
        const recipientRmId = opportunity.rm1Id === senderRmId
            ? opportunity.rm2Id
            : opportunity.rm1Id;

        // Check for duplicate pending invitation
        const hasDuplicate = invitationStore.hasPendingInvitation(opportunityId, senderRmId);
        if (hasDuplicate) {
            throw new Error(
                `A pending invitation already exists for opportunity ${opportunityId} from RM ${senderRmId}`
            );
        }

        // Create invitation
        const invitation: Invitation = {
            id: randomUUID(),
            opportunityId,
            senderRmId,
            recipientRmId,
            status: 'pending',
            sentAt: new Date(),
        };

        // Validate invitation data
        const validation = validateInvitation(invitation);
        if (!validation.isValid) {
            throw new Error(`Invalid invitation data: ${validation.errors.join(', ')}`);
        }

        // Store invitation
        const created = invitationStore.create(invitation);

        // Log the action
        await this.logInvitationAction(senderRmId, 'send_invitation', invitation.id, {
            opportunityId,
            recipientRmId,
        });

        return created;
    }

    /**
     * Get all invitations for a specific RM (sent or received)
     * Requirements: 6.2, 6.5
     * 
     * @param rmId - ID of the RM
     * @returns Array of invitations with associated opportunity data
     */
    async getInvitationsForRM(rmId: string): Promise<InvitationWithOpportunity[]> {
        // Get all invitations involving this RM
        const invitations = invitationStore.getByRM(rmId);

        // Enrich invitations with opportunity data
        const enrichedInvitations: InvitationWithOpportunity[] = invitations.map(invitation => {
            const opportunity = opportunityStore.read(invitation.opportunityId);

            return {
                ...invitation,
                opportunity: opportunity || null,
            };
        });

        // Sort by sentAt (most recent first)
        enrichedInvitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

        return enrichedInvitations;
    }

    /**
     * Get invitations received by an RM
     * Requirements: 6.2, 6.5
     * 
     * @param rmId - ID of the RM
     * @returns Array of received invitations with opportunity data
     */
    async getReceivedInvitations(rmId: string): Promise<InvitationWithOpportunity[]> {
        const invitations = invitationStore.getReceivedByRM(rmId);

        const enrichedInvitations: InvitationWithOpportunity[] = invitations.map(invitation => {
            const opportunity = opportunityStore.read(invitation.opportunityId);

            return {
                ...invitation,
                opportunity: opportunity || null,
            };
        });

        enrichedInvitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

        return enrichedInvitations;
    }

    /**
     * Get invitations sent by an RM
     * Requirements: 6.2, 6.5
     * 
     * @param rmId - ID of the RM
     * @returns Array of sent invitations with opportunity data
     */
    async getSentInvitations(rmId: string): Promise<InvitationWithOpportunity[]> {
        const invitations = invitationStore.getSentByRM(rmId);

        const enrichedInvitations: InvitationWithOpportunity[] = invitations.map(invitation => {
            const opportunity = opportunityStore.read(invitation.opportunityId);

            return {
                ...invitation,
                opportunity: opportunity || null,
            };
        });

        enrichedInvitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

        return enrichedInvitations;
    }

    /**
     * Respond to an invitation (accept or decline)
     * Requirements: 6.2
     * 
     * @param invitationId - ID of the invitation
     * @param respondingRmId - ID of the RM responding
     * @param status - New status ('accepted' or 'declined')
     * @returns The updated invitation
     * @throws Error if invitation not found or RM not authorized
     */
    async respondToInvitation(
        invitationId: string,
        respondingRmId: string,
        status: 'accepted' | 'declined'
    ): Promise<Invitation> {
        // Validate invitation exists
        const invitation = invitationStore.read(invitationId);
        if (!invitation) {
            throw new Error(`Invitation not found: ${invitationId}`);
        }

        // Validate responding RM is the recipient
        if (invitation.recipientRmId !== respondingRmId) {
            throw new Error(
                `RM ${respondingRmId} is not authorized to respond to invitation ${invitationId}`
            );
        }

        // Validate invitation is still pending
        if (invitation.status !== 'pending') {
            throw new Error(
                `Invitation ${invitationId} has already been ${invitation.status}`
            );
        }

        // Update invitation
        const updated = invitationStore.update(invitationId, {
            status,
            respondedAt: new Date(),
        });

        if (!updated) {
            throw new Error(`Failed to update invitation ${invitationId}`);
        }

        // Log the action
        await this.logInvitationAction(respondingRmId, 'respond_to_invitation', invitationId, {
            status,
            opportunityId: invitation.opportunityId,
        });

        return updated;
    }

    /**
     * Check if a duplicate invitation exists
     * Requirements: 6.4
     * 
     * @param opportunityId - ID of the opportunity
     * @param senderRmId - ID of the sender RM
     * @returns True if a pending invitation exists
     */
    async checkDuplicateInvitation(opportunityId: string, senderRmId: string): Promise<boolean> {
        return invitationStore.hasPendingInvitation(opportunityId, senderRmId);
    }

    /**
     * Get invitations for a specific opportunity
     * Requirements: 6.5
     * 
     * @param opportunityId - ID of the opportunity
     * @returns Array of invitations for the opportunity
     */
    async getInvitationsForOpportunity(opportunityId: string): Promise<Invitation[]> {
        return invitationStore.getByOpportunity(opportunityId);
    }

    /**
     * Log invitation-related actions for audit
     * 
     * @param rmId - ID of the RM performing the action
     * @param action - Action being performed
     * @param invitationId - ID of the invitation
     * @param details - Additional details
     */
    private async logInvitationAction(
        rmId: string,
        action: string,
        invitationId: string,
        details: Record<string, any>
    ): Promise<void> {
        const logEntry = {
            id: randomUUID(),
            timestamp: new Date(),
            rmId,
            action,
            resourceType: 'invitation',
            resourceId: invitationId,
            details,
        };

        auditLogStore.create(logEntry);
    }
}

/**
 * Extended invitation type that includes opportunity data
 * Requirements: 6.5
 */
export interface InvitationWithOpportunity extends Invitation {
    opportunity: Opportunity | null;
}

// Export singleton instance
export const collaborationService = new CollaborationService();
