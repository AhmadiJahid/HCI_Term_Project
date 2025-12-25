"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Trial {
    id: string;
    promptText: string;
    condition: string;
    audioPath: string | null;
    recordingDuration: number | null;
    trialIndex: number;
    sudsPre: number | null;
    sudsPost: number | null;
    finishedAt: string | null;
}

interface Participant {
    participantId: string;
    createdAt: string;
    completed: boolean;
    trials: Trial[];
}

export default function RecordingsPage() {
    const params = useParams();
    const router = useRouter();
    const participantId = params.participantId as string;

    const [participant, setParticipant] = useState<Participant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playingTrialId, setPlayingTrialId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/recordings/${participantId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setError("Participant not found");
                    } else {
                        setError("Failed to fetch recordings");
                    }
                    return;
                }
                const data = await response.json();
                setParticipant(data);
            } catch {
                setError("Failed to fetch recordings");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [participantId]);

    const formatDuration = (seconds: number | null): string => {
        if (!seconds) return "—";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </main>
        );
    }

    if (error || !participant) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-400">{error || "Participant not found"}</h1>
                    <button
                        onClick={() => router.push("/admin")}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                    >
                        Go to Admin
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <button
                        onClick={() => router.push("/admin")}
                        className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                        ← Back to Admin
                    </button>
                    <h1 className="text-3xl font-bold">
                        Recordings for <span className="text-blue-400">{participant.participantId}</span>
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Created: {new Date(participant.createdAt).toLocaleString()} •
                        Status: {participant.completed ?
                            <span className="text-green-400">Completed</span> :
                            <span className="text-yellow-400">In Progress</span>
                        }
                    </p>
                </header>

                {participant.trials.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        No trials recorded yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {participant.trials
                            .sort((a, b) => a.trialIndex - b.trialIndex)
                            .map((trial) => (
                                <div
                                    key={trial.id}
                                    className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-semibold">
                                                    Trial {trial.trialIndex + 1}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${trial.condition === "experiment"
                                                    ? "bg-purple-900/50 text-purple-300"
                                                    : "bg-gray-700 text-gray-300"
                                                    }`}>
                                                    {trial.condition === "experiment" ? "Safe Review" : "Control"}
                                                </span>
                                                {!trial.finishedAt && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-900/50 text-yellow-300">
                                                        Incomplete
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-300 text-sm mb-3">{trial.promptText}</p>
                                            <div className="flex gap-4 text-xs text-gray-400">
                                                <span>Duration: {formatDuration(trial.recordingDuration)}</span>
                                                {trial.sudsPre !== null && (
                                                    <span>SUDS Pre: {trial.sudsPre}</span>
                                                )}
                                                {trial.sudsPost !== null && (
                                                    <span>SUDS Post: {trial.sudsPost}</span>
                                                )}
                                                {trial.sudsPre !== null && trial.sudsPost !== null && (
                                                    <span className={`font-semibold ${trial.sudsPost < trial.sudsPre ? "text-green-400" : "text-red-400"
                                                        }`}>
                                                        ΔSUDS: {trial.sudsPost - trial.sudsPre}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {trial.audioPath ? (
                                                <div className="space-y-2">
                                                    <audio
                                                        id={`audio-${trial.id}`}
                                                        src={trial.audioPath}
                                                        preload="metadata"
                                                        onPlay={() => setPlayingTrialId(trial.id)}
                                                        onPause={() => setPlayingTrialId(null)}
                                                        onEnded={() => setPlayingTrialId(null)}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const audio = document.getElementById(`audio-${trial.id}`) as HTMLAudioElement;
                                                            if (audio) {
                                                                if (playingTrialId === trial.id) {
                                                                    audio.pause();
                                                                } else {
                                                                    // Pause any other playing audio
                                                                    document.querySelectorAll('audio').forEach((a) => {
                                                                        if (a !== audio) a.pause();
                                                                    });
                                                                    audio.play();
                                                                }
                                                            }
                                                        }}
                                                        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
                                                    >
                                                        {playingTrialId === trial.id ? (
                                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">N/A</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </main>
    );
}
