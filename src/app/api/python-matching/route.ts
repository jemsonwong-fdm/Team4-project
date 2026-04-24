import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth();

        const baseUrl = process.env.MATCHING_API_URL || 'http://127.0.0.1:8080';

        try {
            const [healthRes, briefsRes, bestRes] = await Promise.all([
                fetch(`${baseUrl}/health`, { cache: 'no-store' }),
                fetch(`${baseUrl}/briefs/text?limit=200`, { cache: 'no-store' }),
                fetch(`${baseUrl}/opportunities?min_score=0&limit=1`, { cache: 'no-store' })
            ]);

            if (!healthRes.ok || !briefsRes.ok || !bestRes.ok) {
                return NextResponse.json({
                    success: true,
                    data: {
                        running: false,
                        text: '',
                        bestMatchingPairText: '',
                        message: `Python backend responded with status ${healthRes.status}/${briefsRes.status}/${bestRes.status}`
                    }
                });
            }

            const health = await healthRes.json();
            const text = await briefsRes.text();
            const bestData = await bestRes.json() as {
                opportunities?: Array<{
                    title?: string;
                    pairing?: string;
                    geographicProximity?: string;
                    matchScore?: number;
                    reasoning?: string;
                }>;
            };

            const best = bestData.opportunities?.[0];
            const bestMatchingPairText = best
                ? [
                    'Best Matching Pair',
                    '',
                    `Opportunity Title: ${best.title || 'N/A'}`,
                    'Match & Score:',
                    `  Ecosystem pairing: ${best.pairing || 'N/A'}`,
                    `  Geographic proximity: ${best.geographicProximity || 'N/A'}`,
                    `  Match score: ${best.matchScore ?? 'N/A'}`,
                    'Match Explanation:',
                    `${best.reasoning || 'N/A'}`,
                ].join('\n')
                : 'No best matching pair returned.';

            return NextResponse.json({
                success: true,
                data: {
                    running: !!health?.ok,
                    text,
                    bestMatchingPairText,
                    message: 'Python backend is running'
                }
            });
        } catch {
            return NextResponse.json({
                success: true,
                data: {
                    running: false,
                    text: '',
                    bestMatchingPairText: '',
                    message: `Python backend not reachable at ${baseUrl}`
                }
            });
        }
    } catch (error) {
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to load Python matching output' },
            { status: 500 }
        );
    }
}
