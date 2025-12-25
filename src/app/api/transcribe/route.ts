import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: "audio file is required" },
                { status: 400 }
            );
        }

        const transcribeUrl = process.env.TRANSCRIBE_URL;
        const transcribeApiKey = process.env.TRANSCRIBE_API_KEY;

        // If no external API configured, return mock/placeholder
        if (!transcribeUrl) {
            return NextResponse.json({
                transcript: null,
                message: "Transcription service not configured",
            });
        }

        // Forward to external transcription API
        const externalFormData = new FormData();
        externalFormData.append("audio", audioFile);

        const response = await fetch(transcribeUrl, {
            method: "POST",
            headers: transcribeApiKey
                ? { Authorization: `Bearer ${transcribeApiKey}` }
                : {},
            body: externalFormData,
        });

        if (!response.ok) {
            console.error("Transcription API error:", response.status);
            return NextResponse.json({
                transcript: null,
                error: "Transcription service unavailable",
            });
        }

        const data = await response.json();
        return NextResponse.json({ transcript: data.transcript || data.text || null });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({
            transcript: null,
            error: "Failed to transcribe audio",
        });
    }
}
