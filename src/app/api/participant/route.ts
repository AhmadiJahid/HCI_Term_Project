import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Retrieve participant(s)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const participantId = searchParams.get("participantId");

    try {
        if (id) {
            const participant = await prisma.participant.findUnique({
                where: { id },
                include: { trials: true },
            });
            return NextResponse.json(participant);
        }

        if (participantId) {
            const participant = await prisma.participant.findUnique({
                where: { participantId },
                include: { trials: true },
            });
            return NextResponse.json(participant);
        }

        // Return all participants
        const participants = await prisma.participant.findMany({
            include: { trials: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(participants);
    } catch (error) {
        console.error("Failed to get participant:", error);
        return NextResponse.json({ error: "Failed to get participant" }, { status: 500 });
    }
}

// POST - Create a new participant
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            participantId,
            age,
            gender,
            educationLevel,
            techAdaptation,
            speakingAnx,
            assignedCondition,
        } = body;

        if (!participantId || !assignedCondition) {
            return NextResponse.json(
                { error: "participantId and assignedCondition are required" },
                { status: 400 }
            );
        }

        // Check if participantId already exists
        const existing = await prisma.participant.findUnique({
            where: { participantId },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Participant ID already exists" },
                { status: 409 }
            );
        }

        const participant = await prisma.participant.create({
            data: {
                participantId,
                age: age ? parseInt(age) : null,
                gender: gender || null,
                educationLevel: educationLevel || null,
                techAdaptation: techAdaptation ? parseInt(techAdaptation) : null,
                speakingAnx: speakingAnx ? parseInt(speakingAnx) : null,
                assignedCondition,
            },
        });

        return NextResponse.json(participant);
    } catch (error) {
        console.error("Failed to create participant:", error);
        return NextResponse.json({ error: "Failed to create participant" }, { status: 500 });
    }
}

// PATCH - Update participant
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Participant id required" }, { status: 400 });
        }

        const participant = await prisma.participant.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json(participant);
    } catch (error) {
        console.error("Failed to update participant:", error);
        return NextResponse.json({ error: "Failed to update participant" }, { status: 500 });
    }
}
