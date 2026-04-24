"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const RMS = [
    { id: "rm-001", name: "Sarah Chen", segment: "Project Developers" },
    { id: "rm-002", name: "Miguel Alvarez", segment: "Technology & Equipment Suppliers" },
    { id: "rm-003", name: "Priya Nair", segment: "Project Sponsors & Investors" },
    { id: "rm-004", name: "James Okafor", segment: "Energy Off-takers" }
];

export default function LoginPage() {
    const [selectedRM, setSelectedRM] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async () => {
        if (!selectedRM) {
            toast.error("Please select an RM");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ rmId: selectedRM }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Logged in as ${data.data.rm.name}`);
                const redirectTo = searchParams.get("redirect");
                const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
                router.push(safeRedirect);
            } else {
                toast.error(data.error || "Login failed");
            }
        } catch (error) {
            toast.error("Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Cross-Ecosystem Opportunity Finder</CardTitle>
                    <CardDescription>Select your RM profile to continue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select RM</label>
                        <Select value={selectedRM} onValueChange={setSelectedRM}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an RM..." />
                            </SelectTrigger>
                            <SelectContent>
                                {RMS.map((rm) => (
                                    <SelectItem key={rm.id} value={rm.id}>
                                        {rm.name} - {rm.segment}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        className="w-full"
                        onClick={handleLogin}
                        disabled={loading || !selectedRM}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
