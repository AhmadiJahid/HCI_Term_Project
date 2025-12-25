"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsentPage() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);

    const handleContinue = () => {
        if (agreed) {
            router.push("/setup");
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700 shadow-xl">
                    <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Safe Review Speech Practice Study
                    </h1>

                    <div className="space-y-6 text-gray-300">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">Purpose of the Study</h2>
                            <p>
                                This study explores how different methods of reviewing recorded speech
                                affect comfort and self-perception during speaking practice. You will
                                complete a series of short speaking tasks and review your recordings
                                using different interfaces.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">What You Will Do</h2>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Record yourself speaking in response to 6 prompts</li>
                                <li>Review your recordings using provided tools</li>
                                <li>Rate your experience after each recording</li>
                                <li>Complete brief demographic questions at the start</li>
                            </ul>
                            <p className="mt-3">
                                The entire session should take approximately <strong>20-30 minutes</strong>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">Privacy & Data</h2>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Your voice will be recorded during speaking tasks</li>
                                <li>Recordings are stored locally and used only for research purposes</li>
                                <li>Your responses are associated with an anonymous participant ID</li>
                                <li>No personally identifying information will be collected</li>
                                <li>Data will be analyzed in aggregate for research findings</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
                            <p>
                                Participation is voluntary. You may stop at any time by closing
                                your browser. Partial data from incomplete sessions may be excluded
                                from analysis.
                            </p>
                        </section>

                        <section className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                            <h2 className="text-lg font-semibold text-blue-300 mb-2">Questions?</h2>
                            <p className="text-sm">
                                If you have questions about this study, please contact the research
                                team before proceeding.
                            </p>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 
                  focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                            <span className="text-gray-200">
                                I have read and understood the information above and agree to participate
                            </span>
                        </label>

                        <button
                            onClick={handleContinue}
                            disabled={!agreed}
                            className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all
                ${agreed
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-900/30"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Continue to Study Setup
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
