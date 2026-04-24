"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Opportunity } from "@/lib/models";
import { invitationsApi } from "@/lib/api/client";
import { Users, TrendingUp, AlertCircle, Building2, Send, Loader2 } from "lucide-react";
import { getEcosystemIcon } from "@/lib/utils/ecosystem-icons";

interface OpportunityDetailProps {
    opportunity: Opportunity;
    onClose: () => void;
    onInvitationSent?: () => void;
}

export default function OpportunityDetail({
    opportunity,
    onClose,
    onInvitationSent,
}: OpportunityDetailProps) {
    const [sending, setSending] = useState(false);

    const handleSendInvitation = async () => {
        try {
            setSending(true);
            await invitationsApi.send(opportunity.id);
            onInvitationSent?.();
            onClose();
        } catch (error) {
            // Error is already handled by the API client with toast
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{opportunity.title}</DialogTitle>
                    <DialogDescription>
                        Opportunity ID: {opportunity.id}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Match Score and Confidence */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <div className="text-3xl font-bold">{opportunity.matchScore}</div>
                                <div className="text-xs text-muted-foreground">Match Score</div>
                            </div>
                        </div>
                        <Badge
                            variant={
                                opportunity.confidence === "high"
                                    ? "default"
                                    : opportunity.confidence === "medium"
                                        ? "secondary"
                                        : "outline"
                            }
                            className="h-fit"
                        >
                            {opportunity.confidence} confidence
                        </Badge>
                        {opportunity.flaggedForReview && (
                            <Badge variant="destructive" className="h-fit">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Flagged for Review
                            </Badge>
                        )}
                    </div>

                    {/* Players */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Players
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Client 1 */}
                            <div className="flex items-start gap-3 p-3 rounded-lg border">
                                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-semibold">{opportunity.client1.companyName}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {opportunity.client1.geography}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {opportunity.client1.ecosystemPositions.map((pos, idx) => {
                                            const Icon = getEcosystemIcon(pos);
                                            return (
                                                <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                                                    <Icon className="h-3 w-3" />
                                                    {pos}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        RM: {opportunity.rm1Id}
                                    </div>
                                </div>
                            </div>

                            {/* Client 2 */}
                            <div className="flex items-start gap-3 p-3 rounded-lg border">
                                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-semibold">{opportunity.client2.companyName}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {opportunity.client2.geography}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {opportunity.client2.ecosystemPositions.map((pos, idx) => {
                                            const Icon = getEcosystemIcon(pos);
                                            return (
                                                <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                                                    <Icon className="h-3 w-3" />
                                                    {pos}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        RM: {opportunity.rm2Id}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trigger */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Why This Opportunity Exists</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">{opportunity.trigger}</p>
                        </CardContent>
                    </Card>

                    {/* Banking Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Suggested Banking Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {opportunity.suggestedBankingProducts.map((product, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border">
                                        <div className="font-medium text-sm">{product.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {product.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reasoning */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">AI Reasoning</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {opportunity.reasoning}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground">
                        Created: {new Date(opportunity.createdAt).toLocaleString()}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={sending}>
                        Close
                    </Button>
                    <Button onClick={handleSendInvitation} disabled={sending}>
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invitation to Other RM
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
