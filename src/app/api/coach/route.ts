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

        // Forward to external coaching API (OpenAI/Groq format)
        const systemPrompt = `You are a supportive speech coach. Analyze the following speech transcript and provide:
1. strength: One specific thing the speaker did well (1-2 sentences)
2. tip: One constructive suggestion for improvement (1-2 sentences)  
3. reframe: A positive reframe of any anxiety or nervousness (1-2 sentences)

The original prompt was: ${prompt || "Practice speech"}

Respond in JSON format: {"strength": "...", "tip": "...", "reframe": "..."}`;

        const response = await fetch(coachUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(coachApiKey ? { Authorization: `Bearer ${coachApiKey}` } : {}),
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Transcript: ${transcript}` }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
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

        // Parse the response from Groq/OpenAI format
        let coachResponse = { strength: null, tip: null, reframe: null };
        try {
            const content = data.choices?.[0]?.message?.content;
            if (content) {
                // Try to parse JSON from the response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    coachResponse = JSON.parse(jsonMatch[0]);
                }
            }
        } catch (parseError) {
            console.error("Failed to parse coach response:", parseError);
        }

        return NextResponse.json({
            strength: coachResponse.strength || null,
            tip: coachResponse.tip || null,
            reframe: coachResponse.reframe || null,
            stats: {
                word_count: wordCount,
                filler_count: fillerCount,
                wpm: null,
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
