"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Invitation, Opportunity } from "@/lib/models";
import { Check, X, Clock, User, Building2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getEcosystemIcon } from "@/lib/utils/ecosystem-icons";

interface InvitationWithOpportunity extends Invitation {
    opportunity?: Opportunity;
}

interface InvitationCardProps {
    invitation: InvitationWithOpportunity;
    onRespond: (invitationId: string, status: "accepted" | "declined") => Promise<void>;
}

export default function InvitationCard({ invitation, onRespond }: InvitationCardProps) {
    const [responding, setResponding] = useState(false);

    const handleAccept = async () => {
        try {
            setResponding(true);
            await onRespond(invitation.id, "accepted");
            toast.success("Invitation accepted!");
        } catch (error) {
            toast.error("Failed to accept invitation");
        } finally {
            setResponding(false);
        }
    };

    const handleDecline = async () => {
        try {
            setResponding(true);
            await onRespond(invitation.id, "declined");
            toast.success("Invitation declined");
        } catch (error) {
            toast.error("Failed to decline invitation");
        } finally {
            setResponding(false);
        }
    };

    const isPending = invitation.status === "pending";
    const opportunity = invitation.opportunity;

    return (
        <Card className={isPending ? "border-primary/50" : ""}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                        {opportunity ? opportunity.title : `Opportunity ${invitation.opportunityId}`}
                    </CardTitle>
                    <Badge
                        variant={
                            invitation.status === "accepted"
                                ? "default"
                                : invitation.status === "declined"
                                    ? "destructive"
                                    : "secondary"
                        }
                    >
                        {invitation.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Sender Info */}
                <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">{invitation.senderRmId}</span>
                </div>

                {/* Opportunity Details */}
                {opportunity && (
                    <>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium">{opportunity.client1.companyName}</div>
                                    {(() => {
                                        const Icon = getEcosystemIcon(opportunity.client1.ecosystemPositions[0]);
                                        return (
                                            <Badge variant="outline" className="text-xs mt-1 flex items-center gap-1 w-fit">
                                                <Icon className="h-3 w-3" />
                                                {opportunity.client1.ecosystemPositions[0]}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium">{opportunity.client2.companyName}</div>
                                    {(() => {
                                        const Icon = getEcosystemIcon(opportunity.client2.ecosystemPositions[0]);
                                        return (
                                            <Badge variant="outline" className="text-xs mt-1 flex items-center gap-1 w-fit">
                                                <Icon className="h-3 w-3" />
                                                {opportunity.client2.ecosystemPositions[0]}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Match Score */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Match Score:</span>
                            <span className="font-bold text-lg">{opportunity.matchScore}</span>
                            <Badge
                                variant={
                                    opportunity.confidence === "high"
                                        ? "default"
                                        : opportunity.confidence === "medium"
                                            ? "secondary"
                                            : "outline"
                                }
                                className="text-xs"
                            >
                                {opportunity.confidence}
                            </Badge>
                        </div>

                        {/* Trigger Preview */}
                        <div className="text-sm text-muted-foreground line-clamp-2">
                            {opportunity.trigger}
                        </div>
                    </>
                )}

                {/* Timestamps */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    <span>Sent: {new Date(invitation.sentAt).toLocaleDateString()}</span>
                </div>
                {invitation.respondedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Responded: {new Date(invitation.respondedAt).toLocaleDateString()}</span>
                    </div>
                )}
            </CardContent>

            {isPending && (
                <CardFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleDecline}
                        disabled={responding}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                    </Button>
                    <Button className="flex-1" onClick={handleAccept} disabled={responding}>
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
