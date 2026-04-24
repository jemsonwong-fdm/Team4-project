"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Opportunity } from "@/lib/models";
import { getEcosystemIcon } from "@/lib/utils/ecosystem-icons";
import rmsData from "@/data/mock/rms.json";

interface OpportunityTableProps {
    opportunities: Opportunity[];
    onRowClick: (opportunity: Opportunity) => void;
}

export default function OpportunityTable({
    opportunities,
    onRowClick,
}: OpportunityTableProps) {
    const rmNameById = new Map(rmsData.map((rm) => [rm.id, rm.name]));

    const getRmFirstName = (rmId: string) => {
        const fullName = rmNameById.get(rmId);
        return fullName ? fullName.split(" ")[0] : rmId;
    };

    const getSignal = (index: number, score: number) => {
        if (index === 0) return { label: "★ Top Match", tone: "default" as const };
        if (index === 1) return { label: "◆ Strong", tone: "secondary" as const };
        if (index === 2) return { label: "▲ Watch", tone: "outline" as const };
        if (score >= 85) return { label: "● Hot", tone: "secondary" as const };
        return null;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Signal</TableHead>
                    <TableHead>Client 1</TableHead>
                    <TableHead>Position 1</TableHead>
                    <TableHead>Client 2</TableHead>
                    <TableHead>Position 2</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>RMs</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {opportunities.map((opportunity, index) => {
                    const Icon1 = getEcosystemIcon(opportunity.client1.ecosystemPositions[0]);
                    const Icon2 = getEcosystemIcon(opportunity.client2.ecosystemPositions[0]);
                    const signal = getSignal(index, opportunity.matchScore);
                    return (
                        <TableRow
                            key={opportunity.id}
                            onClick={() => onRowClick(opportunity)}
                            className={index < 3 ? "cursor-pointer bg-muted/30" : "cursor-pointer"}
                        >
                            <TableCell>
                                {signal ? (
                                    <Badge variant={signal.tone} className="text-xs">
                                        {signal.label}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell className="font-medium">
                                {opportunity.client1.companyName}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs whitespace-normal flex items-center gap-1 w-fit">
                                    <Icon1 className="h-3 w-3" />
                                    {opportunity.client1.ecosystemPositions[0]}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                                {opportunity.client2.companyName}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs whitespace-normal flex items-center gap-1 w-fit">
                                    <Icon2 className="h-3 w-3" />
                                    {opportunity.client2.ecosystemPositions[0]}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold">{opportunity.matchScore}</span>
                                    {opportunity.flaggedForReview && (
                                        <Badge variant="destructive" className="text-xs">
                                            Review
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        opportunity.confidence === "high"
                                            ? "default"
                                            : opportunity.confidence === "medium"
                                                ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {opportunity.confidence}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {getRmFirstName(opportunity.rm1Id)} / {getRmFirstName(opportunity.rm2Id)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
