"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FinishPage() {
    const router = useRouter();

    useEffect(() => {
        // Clear session storage
        const participantCode = sessionStorage.getItem("participantCode");
        if (!participantCode) {
            router.push("/consent");
        }
    }, [router]);

    const handleNewParticipant = () => {
        sessionStorage.clear();
        router.push("/consent");
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
            <div className="max-w-xl mx-auto px-6 text-center">
                <div className="bg-gray-800/50 rounded-2xl p-10 backdrop-blur-sm border border-gray-700 shadow-xl">
                    <div className="text-6xl mb-6">🎉</div>

                    <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        Study Complete!
                    </h1>

                    <p className="text-gray-300 text-lg mb-8">
                        Thank you for participating in our research study.
                        Your responses have been recorded.
                    </p>

                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-6 mb-8 text-left">
                        <h2 className="text-lg font-semibold text-blue-300 mb-3">Debriefing</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            This study compared two different ways of reviewing speech recordings.
                            In the <strong>Control</strong> condition, you reviewed your recording
                            with a simple audio player. In the <strong>Safe Review</strong> condition,
                            you had access to a transcript, AI-generated feedback, and speaking statistics.
                        </p>
                        <p className="text-gray-300 text-sm leading-relaxed mt-3">
                            We are investigating whether having access to structured, supportive
                            feedback tools can reduce anxiety during speech practice compared to
                            simply listening to one&apos;s own recording.
                        </p>
                        <p className="text-gray-400 text-xs mt-4 italic">
                            Note: The AI feedback provided general speaking practice suggestions
                            and was not intended as clinical assessment of any kind.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleNewParticipant}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold 
                transition-all shadow-lg"
                        >
                            Start New Participant
                        </button>

                        <Link
                            href="/admin"
                            className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors"
                        >
                            Researcher: Go to Admin Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
