"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SudsSlider from "@/components/SudsSlider";
import AudioRecorder from "@/components/AudioRecorder";
import ReviewControl from "@/components/ReviewControl";
import ReviewExperiment from "@/components/ReviewExperiment";
import LikertScale from "@/components/LikertScale";
import { logEvent, EVENTS } from "@/lib/logEvent";
import prompts from "@/data/prompts.json";

type Phase = "prompt" | "suds-pre" | "recording" | "review" | "suds-post" | "post-items";
type Condition = "control" | "experiment";

interface TrialData {
    id: string;
    condition: Condition;
    promptId: string;
    promptText: string;
    trialIndex: number;
}

export default function TrialPage() {
    const router = useRouter();

    // Session state
    const [participantId, setParticipantId] = useState<string>("");
    const [assignedCondition, setAssignedCondition] = useState<string>("");
    const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
    const [trials, setTrials] = useState<TrialData[]>([]);

    // Trial state
    const [phase, setPhase] = useState<Phase>("prompt");
    const [sudsPre, setSudsPre] = useState(50);
    const [sudsPost, setSudsPost] = useState(50);
    const [feltInControl, setFeltInControl] = useState<number | null>(null);
    const [helpful, setHelpful] = useState<number | null>(null);

    // Recording state
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>("");
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [rerecordCount, setRerecordCount] = useState(0);
    const [currentTrialId, setCurrentTrialId] = useState<string>("");

    // Review state
    const [reviewStartTime, setReviewStartTime] = useState<number>(0);
    const [tabsVisited, setTabsVisited] = useState<string[]>([]);
    const [audioPlayed, setAudioPlayed] = useState(false);
    const [textOnlyUsed, setTextOnlyUsed] = useState(false);

    // AI data
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [coachData, setCoachData] = useState<{
        strength: string | null;
        tip: string | null;
        reframe: string | null;
    } | null>(null);
    const [stats, setStats] = useState<{
        wordCount: number | null;
        fillerCount: number | null;
        wpm: number | null;
    } | null>(null);

    // Recording screen timer
    const [recordingScreenOpenTime, setRecordingScreenOpenTime] = useState<number>(0);

    // Initialize session
    useEffect(() => {
        const storedParticipantId = sessionStorage.getItem("participantId");
        const storedAssignedCondition = sessionStorage.getItem("assignedCondition");

        if (!storedParticipantId || !storedAssignedCondition) {
            router.push("/setup");
            return;
        }

        setParticipantId(storedParticipantId);
        setAssignedCondition(storedAssignedCondition);

        // Build trial order (5 random prompts)
        const condition: Condition = storedAssignedCondition as Condition;

        // Shuffle prompts and take 5
        const selectedPrompts = [...prompts]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

        const trialList: TrialData[] = selectedPrompts.map((p, i) => ({
            id: "",
            condition: condition,
            promptId: p.id,
            promptText: p.text,
            trialIndex: i,
        }));

        setTrials(trialList);
    }, [router]);

    const currentTrial = trials[currentTrialIndex];

    // Create trial record when entering a new trial
    useEffect(() => {
        if (!participantId || !currentTrial || currentTrialId) return;

        const createTrial = async () => {
            const response = await fetch("/api/trial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantId,
                    condition: currentTrial.condition,
                    promptId: currentTrial.promptId,
                    promptText: currentTrial.promptText,
                    trialIndex: currentTrial.trialIndex,
                }),
            });

            if (response.ok) {
                const trial = await response.json();
                setCurrentTrialId(trial.id);

                // Update trials array with the ID
                setTrials((prev) =>
                    prev.map((t, i) =>
                        i === currentTrialIndex ? { ...t, id: trial.id } : t
                    )
                );
            }
        };

        createTrial();
    }, [participantId, currentTrial, currentTrialIndex, currentTrialId]);

    // Log phase transitions
    useEffect(() => {
        if (!participantId || !currentTrialId) return;

        if (phase === "suds-pre") {
            logEvent({
                participantId,
                trialId: currentTrialId,
                eventName: EVENTS.ENTER_SUDS_PRE,
            });
        } else if (phase === "recording") {
            setRecordingScreenOpenTime(Date.now());
        } else if (phase === "review") {
            setReviewStartTime(Date.now());
            logEvent({
                participantId,
                trialId: currentTrialId,
                eventName: EVENTS.ENTER_REVIEW,
            });
        }
    }, [phase, participantId, currentTrialId]);

    // Process AI data after recording
    const processAIData = useCallback(async (blob: Blob) => {
        if (!currentTrial || currentTrial.condition !== "experiment") return;

        setIsLoadingAI(true);

        try {
            // Upload audio and get transcription
            const file = new File([blob], "recording.webm", { type: blob.type || "audio/webm" });
            const formData = new FormData();
            formData.append("audio", file);

            const transcribeResponse = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            const transcribeData = await transcribeResponse.json();
            setTranscript(transcribeData.transcript);

            // Get coach feedback if we have a transcript
            if (transcribeData.transcript) {
                const coachResponse = await fetch("/api/coach", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcript: transcribeData.transcript,
                        prompt: currentTrial.promptText,
                    }),
                });

                const coachResult = await coachResponse.json();
                setCoachData({
                    strength: coachResult.strength,
                    tip: coachResult.tip,
                    reframe: coachResult.reframe,
                });

                // Calculate WPM with duration
                const wpm = recordingDuration > 0
                    ? (coachResult.stats.word_count / recordingDuration) * 60
                    : null;

                setStats({
                    wordCount: coachResult.stats.word_count,
                    fillerCount: coachResult.stats.filler_count,
                    wpm,
                });
            }
        } catch (error) {
            console.error("AI processing error:", error);
        } finally {
            setIsLoadingAI(false);
        }
    }, [currentTrial, recordingDuration]);

    // Handle phase actions
    const handlePromptNext = () => {
        setPhase("suds-pre");
    };

    const handleSudsPreSubmit = async () => {
        await logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.SUBMIT_SUDS_PRE,
            metadata: { value: sudsPre },
        });

        await fetch("/api/trial", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: currentTrialId,
                sudsPre,
                startedAt: new Date().toISOString(),
            }),
        });

        setPhase("recording");
    };

    const handleRecordingStart = () => {
        const latency = Date.now() - recordingScreenOpenTime;
        logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.START_RECORDING,
            metadata: { latencyMs: latency },
        });
    };

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
        setAudioBlob(blob);
        setRecordingDuration(duration);

        // Create object URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        await logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.STOP_RECORDING,
            metadata: { durationSec: duration },
        });

        // Upload audio
        const file = new File([blob], "recording.webm", { type: blob.type || "audio/webm" });
        const formData = new FormData();
        formData.append("audio", file);
        formData.append("participantId", participantId);
        formData.append("trialId", currentTrialId);

        const uploadResponse = await fetch("/api/upload-audio", {
            method: "POST",
            body: formData,
        });

        if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            await fetch("/api/trial", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentTrialId,
                    audioPath: uploadData.path,
                    recordingDuration: duration,
                }),
            });
        }

        // Process AI data for experiment condition
        if (currentTrial?.condition === "experiment") {
            processAIData(blob);
        }

        setPhase("review");
    };

    const handleRecordAgain = async () => {
        await logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.RECORD_AGAIN,
        });

        setRerecordCount((prev) => prev + 1);
        setAudioBlob(null);
        setAudioUrl("");
        setTranscript(null);
        setCoachData(null);
        setStats(null);
        setPhase("recording");
    };

    const handleAudioPlay = () => {
        setAudioPlayed(true);
        logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.PLAY_AUDIO,
            metadata: { condition: currentTrial?.condition },
        });
    };

    const handleTabVisit = (tab: string) => {
        if (!tabsVisited.includes(tab)) {
            setTabsVisited((prev) => [...prev, tab]);
        }
        logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.VISIT_TAB,
            metadata: { tab },
        });
    };

    const handleTextOnlyToggle = (enabled: boolean) => {
        setTextOnlyUsed(enabled);
        logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.TOGGLE_TEXT_ONLY,
            metadata: { enabled },
        });
    };

    const handleRetryAI = () => {
        if (audioBlob) {
            processAIData(audioBlob);
        }
    };

    const handleReviewContinue = async () => {
        const reviewTime = (Date.now() - reviewStartTime) / 1000;

        await logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.LEAVE_REVIEW,
            metadata: { reviewTimeSec: reviewTime },
        });

        // Update trial with review data
        await fetch("/api/trial", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: currentTrialId,
                rerecordCount,
                reviewTimeSec: reviewTime,
                audioPlayed,
                textOnlyUsed,
                tabsVisited,
                transcript,
                coachStrength: coachData?.strength,
                coachTip: coachData?.tip,
                coachReframe: coachData?.reframe,
                statsWordCount: stats?.wordCount,
                statsFillerCount: stats?.fillerCount,
                statsWpm: stats?.wpm,
            }),
        });

        setPhase("suds-post");
    };

    const handleSudsPostSubmit = async () => {
        await logEvent({
            participantId,
            trialId: currentTrialId,
            eventName: EVENTS.SUBMIT_SUDS_POST,
            metadata: { value: sudsPost },
        });

        await fetch("/api/trial", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: currentTrialId,
                sudsPost,
            }),
        });

        setPhase("post-items");
    };

    const handlePostItemsContinue = async () => {
        await fetch("/api/trial", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: currentTrialId,
                feltInControl,
                helpful,
                finishedAt: new Date().toISOString(),
            }),
        });

        // Move to next trial or finish
        if (currentTrialIndex < trials.length - 1) {
            // Reset state for next trial
            setCurrentTrialId("");
            setPhase("prompt");
            setSudsPre(50);
            setSudsPost(50);
            setFeltInControl(null);
            setHelpful(null);
            setAudioBlob(null);
            setAudioUrl("");
            setRecordingDuration(0);
            setRerecordCount(0);
            setTabsVisited([]);
            setAudioPlayed(false);
            setTextOnlyUsed(false);
            setTranscript(null);
            setCoachData(null);
            setStats(null);
            setCurrentTrialIndex((prev) => prev + 1);
        } else {
            // Mark participant as completed
            await fetch("/api/participant", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: participantId,
                    completed: true,
                }),
            });

            router.push("/finish");
        }
    };

    // Loading state
    if (!currentTrial) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </main>
        );
    }

    const conditionLabel = currentTrial.condition === "control" ? "Control" : "Safe Review";
    const progressPercent = ((currentTrialIndex + 1) / trials.length) * 100;

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Header */}
            <header className="pt-6 pb-4 px-6">
                <div className="max-w-2xl mx-auto flex justify-between items-center text-sm text-gray-400">
                    <span>
                        Trial {currentTrialIndex + 1} of {trials.length}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentTrial.condition === "experiment"
                        ? "bg-purple-900/50 text-purple-300"
                        : "bg-gray-700 text-gray-300"
                        }`}>
                        {conditionLabel}
                    </span>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Phase: Prompt */}
                {phase === "prompt" && (
                    <div className="text-center space-y-8">
                        <h2 className="text-xl font-medium text-gray-300">Speaking Prompt</h2>
                        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                            <p className="text-xl text-gray-100 leading-relaxed">
                                {currentTrial.promptText}
                            </p>
                        </div>
                        <p className="text-gray-400">
                            Take a moment to think about your response, then click Next when ready.
                        </p>
                        <button
                            onClick={handlePromptNext}
                            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold 
                text-lg transition-all shadow-lg"
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* Phase: SUDS Pre */}
                {phase === "suds-pre" && (
                    <div className="space-y-10">
                        <h2 className="text-xl font-medium text-gray-300 text-center">
                            Before Recording
                        </h2>
                        <SudsSlider
                            value={sudsPre}
                            onChange={setSudsPre}
                            label="Rate your current anxiety level (0-100)"
                        />
                        <div className="text-center">
                            <button
                                onClick={handleSudsPreSubmit}
                                className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 
                  hover:from-red-500 hover:to-red-600 rounded-xl font-semibold 
                  text-lg transition-all shadow-lg shadow-red-900/30"
                            >
                                Begin Recording
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase: Recording */}
                {phase === "recording" && (
                    <div className="space-y-8">
                        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 mb-8">
                            <p className="text-gray-300 text-center">{currentTrial.promptText}</p>
                        </div>
                        <AudioRecorder
                            onRecordingComplete={handleRecordingComplete}
                            onRecordingStart={handleRecordingStart}
                        />
                    </div>
                )}

                {/* Phase: Review */}
                {phase === "review" && (
                    <>
                        {currentTrial.condition === "control" ? (
                            <ReviewControl
                                audioUrl={audioUrl}
                                audioDuration={recordingDuration}
                                onRecordAgain={handleRecordAgain}
                                onContinue={handleReviewContinue}
                                onAudioPlay={handleAudioPlay}
                            />
                        ) : (
                            <ReviewExperiment
                                audioUrl={audioUrl}
                                audioDuration={recordingDuration}
                                transcript={transcript}
                                coachData={coachData}
                                stats={stats}
                                isLoading={isLoadingAI}
                                onRecordAgain={handleRecordAgain}
                                onContinue={handleReviewContinue}
                                onAudioPlay={handleAudioPlay}
                                onTabVisit={handleTabVisit}
                                onTextOnlyToggle={handleTextOnlyToggle}
                                onRetry={handleRetryAI}
                            />
                        )}
                    </>
                )}

                {/* Phase: SUDS Post */}
                {phase === "suds-post" && (
                    <div className="space-y-10">
                        <h2 className="text-xl font-medium text-gray-300 text-center">
                            After Review
                        </h2>
                        <SudsSlider
                            value={sudsPost}
                            onChange={setSudsPost}
                            label="Rate your current anxiety level (0-100)"
                        />
                        <div className="text-center">
                            <button
                                onClick={handleSudsPostSubmit}
                                className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 
                  hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold 
                  text-lg transition-all shadow-lg shadow-green-900/30"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase: Post Items */}
                {phase === "post-items" && (
                    <div className="space-y-10">
                        <h2 className="text-xl font-medium text-gray-300 text-center">
                            Quick Feedback
                        </h2>
                        <LikertScale
                            question="I felt in control during the review process"
                            value={feltInControl}
                            onChange={setFeltInControl}
                            minLabel="Strongly Disagree"
                            maxLabel="Strongly Agree"
                        />
                        <LikertScale
                            question="The review process was helpful"
                            value={helpful}
                            onChange={setHelpful}
                            minLabel="Strongly Disagree"
                            maxLabel="Strongly Agree"
                        />
                        <div className="text-center">
                            <button
                                onClick={handlePostItemsContinue}
                                disabled={feltInControl === null || helpful === null}
                                className={`px-10 py-4 rounded-xl font-semibold text-lg transition-all
                  ${feltInControl === null || helpful === null
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg"
                                    }`}
                            >
                                {currentTrialIndex < trials.length - 1 ? "Next Prompt →" : "Finish Study"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
