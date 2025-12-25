import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { participantId, trialId, eventName, metadata } = body;

        if (!participantId || !eventName) {
            return NextResponse.json(
                { error: "participantId and eventName are required" },
                { status: 400 }
            );
        }

        await prisma.eventLog.create({
            data: {
                participantId,
                trialId: trialId || null,
                eventName,
                metadata: JSON.stringify(metadata || {}),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to log event:", error);
        return NextResponse.json(
            { error: "Failed to log event" },
            { status: 500 }
        );
    }
}
