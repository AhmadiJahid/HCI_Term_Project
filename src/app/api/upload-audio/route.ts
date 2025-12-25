import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;
        const participantId = formData.get("participantId") as string;
        const trialId = formData.get("trialId") as string;

        if (!audioFile || !participantId || !trialId) {
            return NextResponse.json(
                { error: "audio, participantId, and trialId are required" },
                { status: 400 }
            );
        }

        // Create recordings directory if it doesn't exist
        const recordingsDir = path.join(process.cwd(), "public", "recordings", participantId);
        await mkdir(recordingsDir, { recursive: true });

        // Get file extension from mime type
        const ext = audioFile.type.includes("webm") ? "webm" : "mp4";
        const filename = `${trialId}.${ext}`;
        const filepath = path.join(recordingsDir, filename);

        // Convert File to Buffer and write
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        // Return the public URL path
        const publicPath = `/recordings/${participantId}/${filename}`;

        return NextResponse.json({ success: true, path: publicPath });
    } catch (error) {
        console.error("Failed to upload audio:", error);
        return NextResponse.json(
            { error: "Failed to upload audio" },
            { status: 500 }
        );
    }
}
