import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const trials = await prisma.trial.findMany({
            include: {
                participant: {
                    select: {
                        participantId: true,
                        age: true,
                        gender: true,
                        educationLevel: true,
                        techAdaptation: true,
                        speakingAnx: true,
                        assignedCondition: true,
                    },
                },
            },
            orderBy: [
                { participantId: "asc" },
                { trialIndex: "asc" },
            ],
        });

        // Build CSV header
        const headers = [
            "participant_code",
            "participant_age",
            "participant_gender",
            "participant_education",
            "participant_tech_adaptation",
            "participant_speaking_anxiety",
            "assigned_condition",
            "trial_index",
            "condition",
            "prompt_id",
            "prompt_text",
            "suds_pre",
            "suds_post",
            "delta_suds",
            "recording_duration_sec",
            "rerecord_count",
            "review_time_sec",
            "audio_played",
            "text_only_used",
            "tabs_visited",
            "felt_in_control",
            "helpful",
            "word_count",
            "filler_count",
            "wpm",
            "started_at",
            "finished_at",
        ];

        // Build CSV rows
        const rows = trials.map((trial) => {
            const deltaSuds =
                trial.sudsPre !== null && trial.sudsPost !== null
                    ? trial.sudsPost - trial.sudsPre
                    : "";

            return [
                trial.participant?.participantId || "",
                trial.participant?.age || "",
                trial.participant?.gender || "",
                trial.participant?.educationLevel || "",
                trial.participant?.techAdaptation || "",
                trial.participant?.speakingAnx || "",
                trial.participant?.assignedCondition || "",
                trial.trialIndex,
                trial.condition,
                trial.promptId,
                `"${trial.promptText.replace(/"/g, '""')}"`,
                trial.sudsPre !== null ? trial.sudsPre : "",
                trial.sudsPost !== null ? trial.sudsPost : "",
                deltaSuds,
                trial.recordingDuration !== null ? trial.recordingDuration.toFixed(2) : "",
                trial.rerecordCount,
                trial.reviewTimeSec !== null ? trial.reviewTimeSec.toFixed(2) : "",
                trial.audioPlayed,
                trial.textOnlyUsed,
                trial.tabsVisited,
                trial.feltInControl !== null ? trial.feltInControl : "",
                trial.helpful !== null ? trial.helpful : "",
                trial.statsWordCount !== null ? trial.statsWordCount : "",
                trial.statsFillerCount !== null ? trial.statsFillerCount : "",
                trial.statsWpm !== null ? trial.statsWpm.toFixed(1) : "",
                trial.startedAt ? trial.startedAt.toISOString() : "",
                trial.finishedAt ? trial.finishedAt.toISOString() : "",
            ];
        });

        // Combine into CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="study_data_${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("CSV export error:", error);
        return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
    }
}
