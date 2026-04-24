"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OpportunityTable from "@/components/opportunity-table";
import OpportunityDetail from "@/components/opportunity-detail";
import type { Opportunity } from "@/lib/models";
import { opportunitiesApi } from "@/lib/api/client";
import { Search, Loader2 } from "lucide-react";

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPosition, setFilterPosition] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const topThree = filteredOpportunities.slice(0, 3);

    // Fetch opportunities on mount
    useEffect(() => {
        fetchOpportunities();
    }, []);

    // Apply filters when search or filter changes
    useEffect(() => {
        applyFilters();
    }, [searchQuery, filterPosition, opportunities]);

    useEffect(() => {
        const handleAccountSwitch = () => {
            setSelectedOpportunity(null);
            fetchOpportunities();
        };

        window.addEventListener("rm-account-switched", handleAccountSwitch);
        return () => {
            window.removeEventListener("rm-account-switched", handleAccountSwitch);
        };
    }, []);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await opportunitiesApi.list();
            setOpportunities(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...opportunities];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (opp) =>
                    opp.client1.companyName.toLowerCase().includes(query) ||
                    opp.client2.companyName.toLowerCase().includes(query) ||
                    opp.title.toLowerCase().includes(query)
            );
        }

        // Apply ecosystem position filter
        if (filterPosition !== "all") {
            filtered = filtered.filter(
                (opp) =>
                    opp.client1.ecosystemPositions.includes(filterPosition as any) ||
                    opp.client2.ecosystemPositions.includes(filterPosition as any)
            );
        }

        // Sort by match score (descending)
        filtered.sort((a, b) => b.matchScore - a.matchScore);

        setFilteredOpportunities(filtered);
    };

    const handleRowClick = (opportunity: Opportunity) => {
        setSelectedOpportunity(opportunity);
    };

    const handleCloseDetail = () => {
        setSelectedOpportunity(null);
    };

    const handleInvitationSent = () => {
        // Refresh opportunities after sending invitation
        fetchOpportunities();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading opportunities...</p>
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
                        <Button onClick={fetchOpportunities}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Opportunities</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Browse and explore cross-segment client pairings
                </p>
            </div>

            {/* Search and Filter Controls */}
            <Card>
                <CardContent className="pt-4 md:pt-6">
                    <div className="flex gap-3 md:gap-4 flex-wrap">
                        {/* Search Input */}
                        <div className="min-w-50 flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by client name or title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm md:text-base"
                                />
                            </div>
                        </div>

                        {/* Ecosystem Position Filter */}
                        <div className="min-w-50">
                            <select
                                value={filterPosition}
                                onChange={(e) => setFilterPosition(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm md:text-base"
                            >
                                <option value="all">All Positions</option>
                                <option value="Project Developers">Project Developers</option>
                                <option value="EPC Contractors">EPC Contractors</option>
                                <option value="Technology & Equipment Suppliers">Technology Suppliers</option>
                                <option value="Storage Suppliers">Storage Suppliers</option>
                                <option value="Grid & Transmission Operators">Grid Operators</option>
                                <option value="Project Sponsors & Investors">Project Sponsors</option>
                                <option value="Energy Off-takers">Energy Off-takers</option>
                                <option value="Research, Innovation & Early-stage Companies">Research & Innovation</option>
                            </select>
                        </div>

                        <Button variant="outline" onClick={fetchOpportunities} size="sm" className="md:size-default">
                            Refresh
                        </Button>
                    </div>

                    {/* Results Count */}
                    <div className="mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground">
                        Showing {filteredOpportunities.length} of {opportunities.length} opportunities
                    </div>

                    {topThree.length > 0 ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="default">★ Top: {topThree[0].matchScore}</Badge>
                            {topThree[1] ? <Badge variant="secondary">◆ Strong: {topThree[1].matchScore}</Badge> : null}
                            {topThree[2] ? <Badge variant="outline">▲ Watch: {topThree[2].matchScore}</Badge> : null}
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Opportunities Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Available Opportunities</CardTitle>
                    <CardDescription className="text-sm">
                        Click on any row to view detailed information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredOpportunities.length === 0 ? (
                        <div className="text-center py-8 md:py-12 text-muted-foreground">
                            <p className="text-sm md:text-base">No opportunities found matching your criteria.</p>
                            {searchQuery || filterPosition !== "all" ? (
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterPosition("all");
                                    }}
                                    className="mt-2"
                                    size="sm"
                                >
                                    Clear filters
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <OpportunityTable
                                opportunities={filteredOpportunities}
                                onRowClick={handleRowClick}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Opportunity Detail Modal/Panel */}
            {selectedOpportunity && (
                <OpportunityDetail
                    opportunity={selectedOpportunity}
                    onClose={handleCloseDetail}
                    onInvitationSent={handleInvitationSent}
                />
            )}
        </div>
    );
}
