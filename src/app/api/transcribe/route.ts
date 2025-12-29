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

        // Check for API key
        if (!transcribeApiKey) {
            console.error("TRANSCRIBE_API_KEY is empty! Please add your Groq API key to .env");
            return NextResponse.json({
                transcript: null,
                error: "API key not configured",
            });
        }

        // Forward to external transcription API (Groq/OpenAI Whisper format)
        const externalFormData = new FormData();
        const filename = audioFile.name && audioFile.name !== "blob" ? audioFile.name : "recording.webm";
        externalFormData.append("file", audioFile, filename);
        externalFormData.append("model", "whisper-large-v3");

        const response = await fetch(transcribeUrl, {
            method: "POST",
            headers: transcribeApiKey
                ? { Authorization: `Bearer ${transcribeApiKey}` }
                : {},
            body: externalFormData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Transcription API error:", response.status, errorBody);
            // Temporary logging to a file we can read
            const logMsg = `Status: ${response.status}\nBody: ${errorBody}\nEnv URL: ${process.env.TRANSCRIBE_URL}\n`;
            try {
                const fs = require('fs');
                fs.writeFileSync('transcribe_error.log', logMsg);
            } catch (e) { }

            return NextResponse.json({
                transcript: null,
                error: `Transcription service error: ${response.status}`,
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
