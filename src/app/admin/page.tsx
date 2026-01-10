"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Participant {
    id: string;
    participantId: string;
    age: number | null;
    gender: string | null;
    assignedCondition: string;
    completed: boolean;
    createdAt: string;
    trials: Array<{
        id: string;
        condition: string;
        sudsPost: number | null;
        sudsPre: number | null;
    }>;
}

interface Stats {
    participantCount: number;
    totalTrials: number;
    control: {
        trialCount: number;
        meanDeltaSuds: number;
        meanRerecordCount: number;
    };
    experiment: {
        trialCount: number;
        meanDeltaSuds: number;
        meanRerecordCount: number;
    };
    meanLatencySec: number;
    independentTTest: {
        t: number;
        df: number;
        pValue: number;
        pValueLowerTail: number;
        n1: number;
        n2: number;
    } | null;
    linearRegression: {
        slope: number;
        intercept: number;
        rSquared: number;
        pValue: number;
        n: number;
    } | null;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"participants" | "stats">("participants");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [participantsRes, statsRes] = await Promise.all([
                    fetch("/api/participant"),
                    fetch("/api/admin/stats"),
                ]);

                if (participantsRes.status === 401) {
                    router.push("/admin/login");
                    return;
                }

                const participantsData = await participantsRes.json();
                const statsData = await statsRes.json();

                setParticipants(Array.isArray(participantsData) ? participantsData : []);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/admin/auth", { method: "DELETE" });
        router.push("/admin/login");
    };

    const handleExportCSV = () => {
        window.location.href = "/api/admin/export-csv";
    };

    const handleDeleteParticipant = async (id: string, participantId: string) => {
        if (!window.confirm(`Are you sure you want to delete participant ${participantId}? All their trial data and logs will be permanently removed.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/participant?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setParticipants(participants.filter(p => p.id !== id));
                // Refresh stats since a participant was removed
                const statsRes = await fetch("/api/admin/stats");
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || "Failed to delete participant"}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while deleting the participant");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </main>
        );
    }

    const completedCount = participants.filter((p) => p.completed).length;

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-gray-400">Safe Review Speech Practice Study</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
                        >
                            📥 Export CSV
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="text-3xl font-bold text-blue-400">{participants.length}</div>
                        <div className="text-sm text-gray-400">Total Participants</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="text-3xl font-bold text-green-400">{completedCount}</div>
                        <div className="text-sm text-gray-400">Completed</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="text-3xl font-bold text-purple-400">{stats?.totalTrials || 0}</div>
                        <div className="text-sm text-gray-400">Total Trials</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="text-3xl font-bold text-orange-400">
                            {stats?.meanLatencySec ? stats.meanLatencySec.toFixed(1) + "s" : "—"}
                        </div>
                        <div className="text-sm text-gray-400">Avg Latency</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-6">
                    <button
                        onClick={() => setActiveTab("participants")}
                        className={`py-3 px-6 font-medium transition-colors ${activeTab === "participants"
                            ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
                            : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Participants
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`py-3 px-6 font-medium transition-colors ${activeTab === "stats"
                            ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
                            : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Statistics
                    </button>
                </div>

                {/* Participants Tab */}
                {activeTab === "participants" && (
                    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">ID</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Age</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Gender</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Group</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Trials</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                            No participants yet
                                        </td>
                                    </tr>
                                ) : (
                                    participants.map((participant) => (
                                        <tr key={participant.id} className="border-b border-gray-700/50">
                                            <td className="px-4 py-3 font-mono">{participant.participantId}</td>
                                            <td className="px-4 py-3">{participant.age || "—"}</td>
                                            <td className="px-4 py-3 capitalize">{participant.gender || "—"}</td>
                                            <td className="px-4 py-3 text-sm capitalize">
                                                {participant.assignedCondition}
                                            </td>
                                            <td className="px-4 py-3">{participant.trials.length}/5</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${participant.completed
                                                        ? "bg-green-900/50 text-green-300"
                                                        : "bg-yellow-900/50 text-yellow-300"
                                                        }`}
                                                >
                                                    {participant.completed ? "Complete" : "In Progress"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 flex gap-3 items-center">
                                                <Link
                                                    href={`/recordings/${participant.participantId}`}
                                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                                    target="_blank"
                                                >
                                                    Recordings
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteParticipant(participant.id, participant.participantId)}
                                                    className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                                                    title="Delete Participant"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Stats Tab */}
                {activeTab === "stats" && stats && (
                    <div className="space-y-6">
                        {/* Condition Comparison */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold mb-4">Condition Comparison</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-300">Control (Raw Playback)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-700/50 rounded-lg p-3">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {stats.control.meanDeltaSuds.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">Mean ΔSUDS</div>
                                        </div>
                                        <div className="bg-gray-700/50 rounded-lg p-3">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {stats.control.meanRerecordCount.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">Mean Re-records</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-300">Experiment (Safe Review)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-700/50 rounded-lg p-3">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {stats.experiment.meanDeltaSuds.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">Mean ΔSUDS</div>
                                        </div>
                                        <div className="bg-gray-700/50 rounded-lg p-3">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {stats.experiment.meanRerecordCount.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">Mean Re-records</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Independent t-test */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold mb-4">Independent Samples t-test (ΔSUDS: Experiment vs Control)</h2>
                            {stats.independentTTest ? (
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.independentTTest.t.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">t-statistic</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.independentTTest.df.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-400">df</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className={`text-2xl font-bold ${stats.independentTTest.pValue < 0.05 ? "text-green-400" : "text-gray-400"
                                            }`}>
                                            {stats.independentTTest.pValue < 0.001
                                                ? "< .001"
                                                : stats.independentTTest.pValue.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">p-value</div>
                                    </div>
                                    <div className="col-span-1 bg-gray-700/50 rounded-lg p-3 flex flex-col justify-center items-center border border-gray-600">
                                        <div className={`text-sm font-bold uppercase tracking-wider ${stats.independentTTest.pValue < 0.05 ? "text-green-400" : "text-gray-400"}`}>
                                            {stats.independentTTest.pValue < 0.05 ? "Significant" : "Not Significant"}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">α = 0.05</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.independentTTest.n1}
                                        </div>
                                        <div className="text-xs text-gray-400">n (Exp)</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.independentTTest.n2}
                                        </div>
                                        <div className="text-xs text-gray-400">n (Ctrl)</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400">Insufficient data for independent t-test</p>
                            )}
                        </div>

                        {/* Lower-tail Hypothesis */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold mb-2">Lower-Tail Hypothesis Test (Exp &lt; Ctrl)</h2>
                            <p className="text-sm text-gray-400 mb-4">
                                Testing if the Experiment condition significantly reduced SUDS levels more than the Control condition.
                            </p>
                            {stats.independentTTest ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-700/50 rounded-lg p-3 min-w-[120px]">
                                            <div className={`text-2xl font-bold ${stats.independentTTest.pValueLowerTail < 0.05 ? "text-blue-400" : "text-gray-400"}`}>
                                                {stats.independentTTest.pValueLowerTail.toFixed(3)}
                                            </div>
                                            <div className="text-xs text-gray-400">p-value (Lower)</div>
                                        </div>
                                        <div className={`flex-1 px-4 py-3 rounded-lg border ${stats.independentTTest.pValueLowerTail < 0.05
                                            ? "bg-blue-900/20 border-blue-500/50 text-blue-200"
                                            : "bg-gray-700/30 border-gray-600 text-gray-400"
                                            }`}>
                                            <span className="font-bold mr-2">Decision:</span>
                                            {stats.independentTTest.pValueLowerTail < 0.05
                                                ? "Reject Null. The Experiment condition significantly reduced SUDS levels more than Control."
                                                : "Fail to Reject Null. No significant evidence that Experiment is better than Control in reducing SUDS."}
                                        </div>
                                    </div>
                                    {stats.independentTTest.pValue < 0.05 && stats.independentTTest.pValueLowerTail >= 0.05 && (
                                        <div className="bg-yellow-900/20 border border-yellow-500/30 text-yellow-200 p-3 rounded-lg text-sm italic">
                                            Note: The two-tailed test was significant, but the effect direction is opposite to the hypothesis (Experiment delta was higher than Control).
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400">Insufficient data for hypothesis testing</p>
                            )}
                        </div>

                        {/* Linear Regression */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold mb-4">Linear Regression (ΔSUDS ~ Condition)</h2>
                            {stats.linearRegression ? (
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-orange-400">
                                            {stats.linearRegression.slope.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">Slope (β)</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-orange-400">
                                            {stats.linearRegression.intercept.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">Intercept</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-orange-400">
                                            {stats.linearRegression.rSquared.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">R²</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className={`text-2xl font-bold ${stats.linearRegression.pValue < 0.05 ? "text-orange-400" : "text-gray-400"
                                            }`}>
                                            {stats.linearRegression.pValue < 0.001
                                                ? "< .001"
                                                : stats.linearRegression.pValue.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">p-value</div>
                                    </div>
                                    <div className="col-span-4 bg-gray-700/50 rounded-lg p-3 flex flex-col justify-center items-center border border-gray-600 mt-2">
                                        <div className={`text-lg font-bold uppercase tracking-wider ${stats.linearRegression.pValue < 0.05 ? "text-orange-400" : "text-gray-400"}`}>
                                            Decision: {stats.linearRegression.pValue < 0.05 ? "Statistically Significant" : "Not Statistically Significant"}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Based on α = 0.05</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400">Insufficient data for regression analysis</p>
                            )}
                            <p className="text-xs text-gray-500 mt-4">
                                Condition coded as: Control = 0, Experiment = 1. Slope represents the
                                mean difference in ΔSUDS between conditions.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
