import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Retrieve trial(s)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");
    const trialId = searchParams.get("trialId");

    try {
        if (trialId) {
            const trial = await prisma.trial.findUnique({
                where: { id: trialId },
            });
            return NextResponse.json(trial);
        }

        if (participantId) {
            const trials = await prisma.trial.findMany({
                where: { participantId },
                orderBy: { trialIndex: "asc" },
            });
            return NextResponse.json(trials);
        }

        return NextResponse.json({ error: "participantId or trialId required" }, { status: 400 });
    } catch (error) {
        console.error("Failed to get trial:", error);
        return NextResponse.json({ error: "Failed to get trial" }, { status: 500 });
    }
}

// POST - Create a new trial
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { participantId, condition, promptId, promptText, trialIndex } = body;

        if (!participantId || !condition || !promptId || !promptText || trialIndex === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const trial = await prisma.trial.create({
            data: {
                participantId,
                condition,
                promptId,
                promptText,
                trialIndex,
            },
        });

        return NextResponse.json(trial);
    } catch (error) {
        console.error("Failed to create trial:", error);
        return NextResponse.json({ error: "Failed to create trial" }, { status: 500 });
    }
}

// PATCH - Update an existing trial
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Trial id required" }, { status: 400 });
        }

        // Handle tabsVisited as JSON string
        if (updates.tabsVisited && Array.isArray(updates.tabsVisited)) {
            updates.tabsVisited = JSON.stringify(updates.tabsVisited);
        }

        const trial = await prisma.trial.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json(trial);
    } catch (error) {
        console.error("Failed to update trial:", error);
        return NextResponse.json({ error: "Failed to update trial" }, { status: 500 });
    }
}
