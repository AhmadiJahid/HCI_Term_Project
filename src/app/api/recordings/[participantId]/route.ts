import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ participantId: string }> }
) {
    try {
        const { participantId } = await params;

        const participant = await prisma.participant.findUnique({
            where: { participantId },
            include: {
                trials: {
                    orderBy: { trialIndex: "asc" },
                    select: {
                        id: true,
                        promptText: true,
                        condition: true,
                        audioPath: true,
                        recordingDuration: true,
                        trialIndex: true,
                        sudsPre: true,
                        sudsPost: true,
                        finishedAt: true,
                    },
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: "Participant not found" }, { status: 404 });
        }

        return NextResponse.json({
            participantId: participant.participantId,
            createdAt: participant.createdAt,
            completed: participant.completed,
            trials: participant.trials,
        });
    } catch (error) {
        console.error("Error fetching recordings:", error);
        return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
    }
}
