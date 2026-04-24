"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type PythonMatchingResponse = {
    success: boolean;
    data?: {
        running: boolean;
        text: string;
        bestMatchingPairText: string;
        message: string;
    };
    error?: string;
};

export default function PythonMatchingPage() {
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState("");
    const [text, setText] = useState("");
    const [bestMatchingPairText, setBestMatchingPairText] = useState("");

    const fetchOutput = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/python-matching", { cache: "no-store" });
            const result = (await response.json()) as PythonMatchingResponse;

            if (!response.ok || !result.success || !result.data) {
                setRunning(false);
                setMessage(result.error || "Failed to load Python backend output");
                setText("");
                setBestMatchingPairText("");
                return;
            }

            setRunning(result.data.running);
            setMessage(result.data.message);
            setText(result.data.text);
            setBestMatchingPairText(result.data.bestMatchingPairText || "No best pair data returned.");
        } catch {
            setRunning(false);
            setMessage("Failed to load Python backend output");
            setText("");
            setBestMatchingPairText("");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutput();
    }, []);

    return (
        <div className="container mx-auto space-y-4 p-4 md:space-y-6 md:p-6">
            <div>
                <h1 className="text-2xl font-bold md:text-3xl">EcoNav Backend</h1>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    Live backend status + output from the FastAPI service
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Status
                        <Badge variant={running ? "default" : "outline"}>
                            {running ? "Running" : "Not Running"}
                        </Badge>
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={fetchOutput} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            "Refresh"
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Best Matching Pair</CardTitle>
                    <CardDescription>Top match from Python /opportunities endpoint</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="max-h-[35vh] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs leading-5 whitespace-pre-wrap">
                        {bestMatchingPairText || "No best matching pair returned yet."}
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Output</CardTitle>
                    <CardDescription>Directly rendered from Python /briefs/text endpoint</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="max-h-[65vh] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs leading-5 whitespace-pre-wrap">
                        {text || "No text returned yet."}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
