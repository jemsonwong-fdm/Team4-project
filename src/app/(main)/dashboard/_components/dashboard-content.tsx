"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { opportunitiesApi, invitationsApi } from "@/lib/api/client";
import type { Opportunity, Invitation } from "@/lib/models";
import Link from "next/link";
import { TrendingUp, Users, AlertCircle, ArrowRight, Loader2, Database } from "lucide-react";
import { getEcosystemIcon } from "@/lib/utils/ecosystem-icons";

interface DashboardContentProps {
    rmName: string;
    rmSegment: string;
}

export default function DashboardContent({ rmName, rmSegment }: DashboardContentProps) {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isMockMode, setIsMockMode] = useState(true);

    useEffect(() => {
        fetchData();
        checkDataMode();
    }, []);

    const checkDataMode = async () => {
        try {
            const response = await fetch('/api/mock-data/load');
            const result = await response.json();
            if (result.success) {
                setIsMockMode(result.data.isMockMode);
            }
        } catch (error) {
            console.error('Failed to check data mode:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch opportunities (top 5)
            const opps = await opportunitiesApi.list({ limit: 5 });
            setOpportunities(opps);

            // Fetch invitations to get pending count
            const invs = await invitationsApi.list('received');
            const pending = invs.filter((inv: Invitation) => inv.status === 'pending');
            setPendingInvitationsCount(pending.length);
        } catch (error) {
            // Error is already handled by the API client with toast
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateOpportunities = async () => {
        try {
            setGenerating(true);
            await opportunitiesApi.generate();
            // Refresh data after generation
            await fetchData();
        } catch (error) {
            // Error is already handled by the API client with toast
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const highValueCount = opportunities.filter(opp => opp.matchScore >= 80).length;

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Welcome back, {rmName} ({rmSegment})
                    </p>
                </div>
                {isMockMode && (
                    <Badge variant="secondary" className="text-xs md:text-sm flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Mock Data Mode
                    </Badge>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Total Opportunities</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">{opportunities.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cross-segment pairings available
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Pending Invitations</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">{pendingInvitationsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Awaiting your response
                        </p>
                    </CardContent>
                </Card>

                <Card className="sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">High-Value Matches</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl md:text-2xl font-bold">{highValueCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Score 80+ opportunities
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
                    <CardDescription className="text-sm">Generate new opportunities or browse existing ones</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleGenerateOpportunities}
                        disabled={generating}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Generate Opportunities
                            </>
                        )}
                    </Button>
                    <Link href="/opportunities" className="flex-1">
                        <Button variant="outline" className="w-full" size="lg">
                            View All Opportunities
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Top Opportunities */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Top Opportunities</CardTitle>
                    <CardDescription className="text-sm">Highest-scoring cross-segment pairings</CardDescription>
                </CardHeader>
                <CardContent>
                    {opportunities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm md:text-base">No opportunities found. Generate opportunities to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {opportunities.map((opp) => {
                                const Icon1 = getEcosystemIcon(opp.client1.ecosystemPositions[0]);
                                const Icon2 = getEcosystemIcon(opp.client2.ecosystemPositions[0]);
                                return (
                                    <Link key={opp.id} href={`/opportunities?id=${opp.id}`}>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer gap-3">
                                            <div className="flex-1 w-full">
                                                <div className="font-medium text-sm md:text-base">{opp.title}</div>
                                                <div className="text-xs md:text-sm text-muted-foreground mt-1">
                                                    {opp.client1.companyName} × {opp.client2.companyName}
                                                </div>
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                        <Icon1 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">{opp.client1.ecosystemPositions[0]}</span>
                                                        <span className="sm:hidden">{opp.client1.ecosystemPositions[0].split(' ')[0]}</span>
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                        <Icon2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">{opp.client2.ecosystemPositions[0]}</span>
                                                        <span className="sm:hidden">{opp.client2.ecosystemPositions[0].split(' ')[0]}</span>
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="text-right">
                                                    <div className="text-xl md:text-2xl font-bold">{opp.matchScore}</div>
                                                    <div className="text-xs text-muted-foreground">Match Score</div>
                                                </div>
                                                <Badge
                                                    variant={
                                                        opp.confidence === 'high' ? 'default' :
                                                            opp.confidence === 'medium' ? 'secondary' :
                                                                'outline'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {opp.confidence}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
