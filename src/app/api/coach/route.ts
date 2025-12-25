import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transcript, prompt } = body;

        if (!transcript) {
            return NextResponse.json({
                strength: null,
                tip: null,
                reframe: null,
                stats: { word_count: null, filler_count: null, wpm: null },
                error: "No transcript provided",
            });
        }

        const coachUrl = process.env.COACH_URL;
        const coachApiKey = process.env.COACH_API_KEY;

        // Calculate basic stats locally
        const words = transcript.trim().split(/\s+/).filter((w: string) => w.length > 0);
        const wordCount = words.length;

        // Common filler words
        const fillerPatterns = /\b(um|uh|like|you know|basically|actually|literally|so|well|i mean)\b/gi;
        const fillerMatches = transcript.match(fillerPatterns);
        const fillerCount = fillerMatches ? fillerMatches.length : 0;

        // If no external API configured, return just stats
        if (!coachUrl) {
            return NextResponse.json({
                strength: null,
                tip: null,
                reframe: null,
                stats: {
                    word_count: wordCount,
                    filler_count: fillerCount,
                    wpm: null, // Will be calculated on frontend with duration
                },
                message: "Coach service not configured",
            });
        }

        // Forward to external coaching API
        const response = await fetch(coachUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(coachApiKey ? { Authorization: `Bearer ${coachApiKey}` } : {}),
            },
            body: JSON.stringify({ transcript, prompt }),
        });

        if (!response.ok) {
            console.error("Coach API error:", response.status);
            return NextResponse.json({
                strength: null,
                tip: null,
                reframe: null,
                stats: {
                    word_count: wordCount,
                    filler_count: fillerCount,
                    wpm: null,
                },
                error: "Coach service unavailable",
            });
        }

        const data = await response.json();
        return NextResponse.json({
            strength: data.strength || null,
            tip: data.tip || null,
            reframe: data.reframe || null,
            stats: {
                word_count: data.stats?.word_count ?? wordCount,
                filler_count: data.stats?.filler_count ?? fillerCount,
                wpm: data.stats?.wpm ?? null,
            },
        });
    } catch (error) {
        console.error("Coach error:", error);
        return NextResponse.json({
            strength: null,
            tip: null,
            reframe: null,
            stats: { word_count: null, filler_count: null, wpm: null },
            error: "Failed to get coach feedback",
        });
    }
}
