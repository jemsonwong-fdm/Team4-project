"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientsApi } from "@/lib/api/client";
import type { Client } from "@/lib/models";
import { getEcosystemIcon } from "@/lib/utils/ecosystem-icons";
import { Loader2, Search } from "lucide-react";

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [ecosystemPosition, setEcosystemPosition] = useState("all");

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clientsApi.list();
            setClients(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const filteredClients = useMemo(() => {
        let list = [...clients];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((c) =>
                c.companyName.toLowerCase().includes(q) ||
                c.geography.toLowerCase().includes(q) ||
                c.esgAlignment.toLowerCase().includes(q)
            );
        }

        if (ecosystemPosition !== "all") {
            list = list.filter((c) => c.ecosystemPositions.includes(ecosystemPosition as any));
        }

        return list;
    }, [clients, search, ecosystemPosition]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading clients...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={loadClients}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-4 p-4 md:space-y-6 md:p-6">
            <div>
                <h1 className="text-2xl font-bold md:text-3xl">Clients</h1>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    ◼ Your RM portfolio ({clients.length} total clients)
                </p>
            </div>

            <Card>
                <CardContent className="pt-4 md:pt-6">
                    <div className="flex flex-wrap gap-3 md:gap-4">
                        <div className="min-w-50 flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search company, geography, ESG..."
                                    className="w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:ring-ring focus:outline-none md:text-base"
                                />
                            </div>
                        </div>

                        <div className="min-w-50">
                            <select
                                value={ecosystemPosition}
                                onChange={(e) => setEcosystemPosition(e.target.value)}
                                className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none md:text-base"
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

                        <Button variant="outline" onClick={loadClients}>Refresh</Button>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground md:text-sm">
                        Showing {filteredClients.length} of {clients.length} clients
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-3 md:gap-4">
                {filteredClients.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            <p>No clients found for your filter.</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredClients.map((client) => (
                        <Card key={client.id}>
                            <CardContent className="pt-4 md:pt-5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h3 className="font-semibold">{client.companyName}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">◻ {client.geography}</p>
                                    </div>
                                    <Badge variant="secondary">${client.revenue.toLocaleString()}</Badge>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {client.ecosystemPositions.map((pos) => {
                                        const Icon = getEcosystemIcon(pos);
                                        return (
                                            <Badge key={`${client.id}-${pos}`} variant="outline" className="text-xs">
                                                <span className="mr-1 inline-flex items-center gap-1">
                                                    <Icon className="h-3 w-3" />
                                                    {pos}
                                                </span>
                                            </Badge>
                                        );
                                    })}
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground md:text-sm">○ ESG: {client.esgAlignment}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
