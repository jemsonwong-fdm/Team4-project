"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InvitationCard from "@/components/invitation-card";
import type { Invitation, Opportunity } from "@/lib/models";
import { invitationsApi } from "@/lib/api/client";
import { Loader2, Inbox } from "lucide-react";

interface InvitationWithOpportunity extends Invitation {
    opportunity?: Opportunity;
}

export default function InvitationsPage() {
    const [invitations, setInvitations] = useState<InvitationWithOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await invitationsApi.list();
            setInvitations(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleInvitationResponse = async (invitationId: string, status: "accepted" | "declined") => {
        try {
            await invitationsApi.respond(invitationId, status);
            // Refresh invitations after response
            await fetchInvitations();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update invitation");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading invitations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={fetchInvitations}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
    const respondedInvitations = invitations.filter((inv) => inv.status !== "pending");

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Invitations</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Manage collaboration requests from other RMs
                </p>
            </div>

            {/* Pending Invitations */}
            <div>
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Pending Invitations</h2>
                {pendingInvitations.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 md:py-12">
                            <div className="text-center text-muted-foreground">
                                <Inbox className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                                <p className="text-sm md:text-base">No pending invitations</p>
                                <p className="text-xs md:text-sm mt-1">
                                    You'll see collaboration requests from other RMs here
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingInvitations.map((invitation) => (
                            <InvitationCard
                                key={invitation.id}
                                invitation={invitation}
                                onRespond={handleInvitationResponse}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Responded Invitations */}
            {respondedInvitations.length > 0 && (
                <div>
                    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Previous Responses</h2>
                    <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {respondedInvitations.map((invitation) => (
                            <InvitationCard
                                key={invitation.id}
                                invitation={invitation}
                                onRespond={handleInvitationResponse}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
