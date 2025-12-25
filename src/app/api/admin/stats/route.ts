import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { mean, pairedTTest, linearRegression } from "@/lib/stats";

export async function GET() {
    try {
        // Get all completed participants with their trials
        const participants = await prisma.participant.findMany({
            where: { completed: true },
            include: {
                trials: true,
            },
        });

        // Calculate per-condition statistics
        const controlTrials = participants.flatMap((p) =>
            p.trials.filter((t) => t.condition === "control")
        );
        const experimentTrials = participants.flatMap((p) =>
            p.trials.filter((t) => t.condition === "experiment")
        );

        // Calculate ΔSUDS (post - pre) for each trial
        const controlDeltaSuds = controlTrials
            .filter((t) => t.sudsPre !== null && t.sudsPost !== null)
            .map((t) => (t.sudsPost as number) - (t.sudsPre as number));

        const experimentDeltaSuds = experimentTrials
            .filter((t) => t.sudsPre !== null && t.sudsPost !== null)
            .map((t) => (t.sudsPost as number) - (t.sudsPre as number));

        // For paired t-test, we need matched pairs (per participant)
        const pairedControlDelta: number[] = [];
        const pairedExperimentDelta: number[] = [];

        for (const participant of participants) {
            const controlTrialsP = participant.trials.filter(
                (t) => t.condition === "control" && t.sudsPre !== null && t.sudsPost !== null
            );
            const experimentTrialsP = participant.trials.filter(
                (t) => t.condition === "experiment" && t.sudsPre !== null && t.sudsPost !== null
            );

            if (controlTrialsP.length > 0 && experimentTrialsP.length > 0) {
                const controlMean = mean(
                    controlTrialsP.map((t) => (t.sudsPost as number) - (t.sudsPre as number))
                );
                const experimentMean = mean(
                    experimentTrialsP.map((t) => (t.sudsPost as number) - (t.sudsPre as number))
                );

                pairedControlDelta.push(controlMean);
                pairedExperimentDelta.push(experimentMean);
            }
        }

        // Latency (time to start recording - from event logs)
        const events = await prisma.eventLog.findMany({
            where: { eventName: "start_recording" },
        });

        const latencies: number[] = [];
        for (const event of events) {
            try {
                const metadata = JSON.parse(event.metadata);
                if (metadata.latencyMs) {
                    latencies.push(metadata.latencyMs / 1000); // Convert to seconds
                }
            } catch {
                // Skip invalid JSON
            }
        }

        // Rerecord counts
        const controlRerecords = controlTrials.map((t) => t.rerecordCount);
        const experimentRerecords = experimentTrials.map((t) => t.rerecordCount);

        // Run paired t-test
        const tTestResult = pairedTTest(pairedExperimentDelta, pairedControlDelta);

        // Linear regression: ΔSUDS ~ condition (0 = control, 1 = experiment)
        const allDeltaSuds: number[] = [];
        const conditionCodes: number[] = [];

        for (const trial of [...controlTrials, ...experimentTrials]) {
            if (trial.sudsPre !== null && trial.sudsPost !== null) {
                allDeltaSuds.push((trial.sudsPost as number) - (trial.sudsPre as number));
                conditionCodes.push(trial.condition === "experiment" ? 1 : 0);
            }
        }

        const regressionResult = linearRegression(conditionCodes, allDeltaSuds);

        return NextResponse.json({
            participantCount: participants.length,
            totalTrials: controlTrials.length + experimentTrials.length,

            control: {
                trialCount: controlTrials.length,
                meanDeltaSuds: mean(controlDeltaSuds),
                meanRerecordCount: mean(controlRerecords),
            },

            experiment: {
                trialCount: experimentTrials.length,
                meanDeltaSuds: mean(experimentDeltaSuds),
                meanRerecordCount: mean(experimentRerecords),
            },

            meanLatencySec: mean(latencies),

            pairedTTest: tTestResult
                ? {
                    t: tTestResult.t,
                    df: tTestResult.df,
                    pValue: tTestResult.pValue,
                    n: pairedControlDelta.length,
                }
                : null,

            linearRegression: regressionResult
                ? {
                    slope: regressionResult.slope,
                    intercept: regressionResult.intercept,
                    rSquared: regressionResult.rSquared,
                    pValue: regressionResult.pValue,
                    n: allDeltaSuds.length,
                }
                : null,
        });
    } catch (error) {
        console.error("Stats error:", error);
        return NextResponse.json({ error: "Failed to calculate statistics" }, { status: 500 });
    }
}
