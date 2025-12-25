"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Participant {
    id: string;
    participantId: string;
    age: number | null;
    gender: string | null;
    conditionOrder: string;
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
    pairedTTest: {
        t: number;
        df: number;
        pValue: number;
        n: number;
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
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Order</th>
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
                                            <td className="px-4 py-3 text-sm">
                                                {participant.conditionOrder === "control_first" ? "C→E" : "E→C"}
                                            </td>
                                            <td className="px-4 py-3">{participant.trials.length}/6</td>
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
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/recordings/${participant.participantId}`}
                                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                                    target="_blank"
                                                >
                                                    Recordings
                                                </Link>
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

                        {/* Paired t-test */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold mb-4">Paired t-test (ΔSUDS: Experiment vs Control)</h2>
                            {stats.pairedTTest ? (
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.pairedTTest.t.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">t-statistic</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.pairedTTest.df}
                                        </div>
                                        <div className="text-xs text-gray-400">df</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className={`text-2xl font-bold ${stats.pairedTTest.pValue < 0.05 ? "text-green-400" : "text-gray-400"
                                            }`}>
                                            {stats.pairedTTest.pValue < 0.001
                                                ? "< .001"
                                                : stats.pairedTTest.pValue.toFixed(3)}
                                        </div>
                                        <div className="text-xs text-gray-400">p-value</div>
                                    </div>
                                    <div className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-400">
                                            {stats.pairedTTest.n}
                                        </div>
                                        <div className="text-xs text-gray-400">n (pairs)</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400">Insufficient data for paired t-test</p>
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
