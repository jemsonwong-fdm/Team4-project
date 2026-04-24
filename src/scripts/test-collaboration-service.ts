/**
 * Test script for CollaborationService
 * Tests invitation management functionality
 */

import { collaborationService } from '../lib/services/collaborationService';
import { clientStore, opportunityStore, invitationStore } from '../lib/data/stores';
import { EcosystemPosition } from '../lib/models';
import type { Client, Opportunity } from '../lib/models';

async function testCollaborationService() {
    console.log('=== Testing CollaborationService ===\n');

    // Clear stores
    clientStore.clear();
    opportunityStore.clear();
    invitationStore.clear();

    // Create test clients
    const client1: Client = {
        id: 'client-1',
        companyName: 'Solar Innovations Inc',
        ecosystemPositions: [EcosystemPosition.PROJECT_DEVELOPERS],
        geography: 'North America',
        revenue: 50000000,
        esgAlignment: 'Strong ESG commitment',
        rmId: 'rm-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const client2: Client = {
        id: 'client-2',
        companyName: 'Battery Tech Solutions',
        ecosystemPositions: [EcosystemPosition.STORAGE_SUPPLIERS],
        geography: 'Europe',
        revenue: 75000000,
        esgAlignment: 'Carbon neutral by 2030',
        rmId: 'rm-2',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    clientStore.create(client1);
    clientStore.create(client2);

    // Create test opportunity
    const opportunity: Opportunity = {
        id: 'opp-1',
        title: 'Solar + Storage Partnership',
        client1,
        client2,
        rm1Id: 'rm-1',
        rm2Id: 'rm-2',
        trigger: 'Complementary ecosystem positions for green financing',
        suggestedBankingProducts: [
            {
                name: 'Project Finance',
                description: 'Financing for renewable energy projects',
                applicablePositionPairs: [
                    [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.STORAGE_SUPPLIERS]
                ],
            },
        ],
        matchScore: 85,
        reasoning: 'Strong synergy between solar development and battery storage',
        confidence: 'high',
        createdAt: new Date(),
        flaggedForReview: false,
    };

    opportunityStore.create(opportunity);

    console.log('✓ Test data created\n');

    // Test 1: Send invitation
    console.log('Test 1: Send invitation');
    try {
        const invitation = await collaborationService.sendInvitation('opp-1', 'rm-1');
        console.log('✓ Invitation sent successfully');
        console.log(`  ID: ${invitation.id}`);
        console.log(`  Sender: ${invitation.senderRmId}`);
        console.log(`  Recipient: ${invitation.recipientRmId}`);
        console.log(`  Status: ${invitation.status}`);
        console.log(`  Sent at: ${invitation.sentAt.toISOString()}\n`);
    } catch (error) {
        console.error('✗ Failed to send invitation:', error);
    }

    // Test 2: Prevent duplicate invitation
    console.log('Test 2: Prevent duplicate invitation');
    try {
        await collaborationService.sendInvitation('opp-1', 'rm-1');
        console.error('✗ Should have prevented duplicate invitation\n');
    } catch (error) {
        console.log('✓ Duplicate invitation prevented');
        console.log(`  Error: ${(error as Error).message}\n`);
    }

    // Test 3: Get invitations for RM
    console.log('Test 3: Get invitations for RM');
    try {
        const rm1Invitations = await collaborationService.getInvitationsForRM('rm-1');
        const rm2Invitations = await collaborationService.getInvitationsForRM('rm-2');

        console.log(`✓ RM-1 invitations: ${rm1Invitations.length}`);
        console.log(`✓ RM-2 invitations: ${rm2Invitations.length}`);

        if (rm2Invitations.length > 0) {
            const inv = rm2Invitations[0];
            console.log(`  First invitation for RM-2:`);
            console.log(`    Opportunity: ${inv.opportunity?.title || 'N/A'}`);
            console.log(`    Match Score: ${inv.opportunity?.matchScore || 'N/A'}`);
            console.log(`    Status: ${inv.status}\n`);
        }
    } catch (error) {
        console.error('✗ Failed to get invitations:', error);
    }

    // Test 4: Get received invitations
    console.log('Test 4: Get received invitations');
    try {
        const receivedInvitations = await collaborationService.getReceivedInvitations('rm-2');
        console.log(`✓ RM-2 received invitations: ${receivedInvitations.length}`);

        if (receivedInvitations.length > 0) {
            console.log(`  Opportunity included: ${receivedInvitations[0].opportunity !== null}\n`);
        }
    } catch (error) {
        console.error('✗ Failed to get received invitations:', error);
    }

    // Test 5: Get sent invitations
    console.log('Test 5: Get sent invitations');
    try {
        const sentInvitations = await collaborationService.getSentInvitations('rm-1');
        console.log(`✓ RM-1 sent invitations: ${sentInvitations.length}\n`);
    } catch (error) {
        console.error('✗ Failed to get sent invitations:', error);
    }

    // Test 6: Respond to invitation (accept)
    console.log('Test 6: Respond to invitation (accept)');
    try {
        const invitations = await collaborationService.getReceivedInvitations('rm-2');
        if (invitations.length > 0) {
            const invitationId = invitations[0].id;
            const updated = await collaborationService.respondToInvitation(invitationId, 'rm-2', 'accepted');
            console.log('✓ Invitation accepted');
            console.log(`  Status: ${updated.status}`);
            console.log(`  Responded at: ${updated.respondedAt?.toISOString()}\n`);
        }
    } catch (error) {
        console.error('✗ Failed to respond to invitation:', error);
    }

    // Test 7: Prevent responding to already-responded invitation
    console.log('Test 7: Prevent responding to already-responded invitation');
    try {
        const invitations = await collaborationService.getReceivedInvitations('rm-2');
        if (invitations.length > 0) {
            const invitationId = invitations[0].id;
            await collaborationService.respondToInvitation(invitationId, 'rm-2', 'declined');
            console.error('✗ Should have prevented responding to already-responded invitation\n');
        }
    } catch (error) {
        console.log('✓ Already-responded invitation prevented');
        console.log(`  Error: ${(error as Error).message}\n`);
    }

    // Test 8: Send invitation from other RM
    console.log('Test 8: Send invitation from other RM');
    try {
        const invitation = await collaborationService.sendInvitation('opp-1', 'rm-2');
        console.log('✓ Invitation sent from RM-2');
        console.log(`  Recipient: ${invitation.recipientRmId}\n`);
    } catch (error) {
        console.error('✗ Failed to send invitation from RM-2:', error);
    }

    // Test 9: Check duplicate invitation detection
    console.log('Test 9: Check duplicate invitation detection');
    try {
        const hasDuplicate = await collaborationService.checkDuplicateInvitation('opp-1', 'rm-2');
        console.log(`✓ Duplicate check result: ${hasDuplicate}\n`);
    } catch (error) {
        console.error('✗ Failed to check duplicate:', error);
    }

    // Test 10: Get invitations for opportunity
    console.log('Test 10: Get invitations for opportunity');
    try {
        const oppInvitations = await collaborationService.getInvitationsForOpportunity('opp-1');
        console.log(`✓ Invitations for opportunity: ${oppInvitations.length}`);
        oppInvitations.forEach((inv, idx) => {
            console.log(`  ${idx + 1}. ${inv.senderRmId} → ${inv.recipientRmId} (${inv.status})`);
        });
        console.log();
    } catch (error) {
        console.error('✗ Failed to get invitations for opportunity:', error);
    }

    // Test 11: Unauthorized response attempt
    console.log('Test 11: Unauthorized response attempt');
    try {
        const invitations = await collaborationService.getSentInvitations('rm-2');
        if (invitations.length > 0) {
            const invitationId = invitations[0].id;
            // Try to respond as the sender (rm-2), not the recipient (rm-1)
            await collaborationService.respondToInvitation(invitationId, 'rm-2', 'accepted');
            console.error('✗ Should have prevented unauthorized response\n');
        }
    } catch (error) {
        console.log('✓ Unauthorized response prevented');
        console.log(`  Error: ${(error as Error).message}\n`);
    }

    // Test 12: Invalid opportunity ID
    console.log('Test 12: Invalid opportunity ID');
    try {
        await collaborationService.sendInvitation('invalid-opp', 'rm-1');
        console.error('✗ Should have rejected invalid opportunity ID\n');
    } catch (error) {
        console.log('✓ Invalid opportunity ID rejected');
        console.log(`  Error: ${(error as Error).message}\n`);
    }

    // Test 13: Unauthorized sender
    console.log('Test 13: Unauthorized sender');
    try {
        await collaborationService.sendInvitation('opp-1', 'rm-3');
        console.error('✗ Should have rejected unauthorized sender\n');
    } catch (error) {
        console.log('✓ Unauthorized sender rejected');
        console.log(`  Error: ${(error as Error).message}\n`);
    }

    console.log('=== All tests completed ===');
}

// Run tests
testCollaborationService().catch(console.error);
