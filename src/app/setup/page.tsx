"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [participantCount, setParticipantCount] = useState(0);

    const [formData, setFormData] = useState({
        participantId: "",
        age: "",
        gender: "",
        educationLevel: "",
        techAdaptation: "",
        speakingAnx: "",
        conditionOrder: "auto",
    });

    useEffect(() => {
        // Get participant count for counterbalancing
        fetch("/api/participant")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setParticipantCount(data.length);
                }
            })
            .catch(console.error);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Determine condition order
            let conditionOrder = formData.conditionOrder;
            if (conditionOrder === "auto") {
                // Counterbalance based on participant count
                conditionOrder = participantCount % 2 === 0 ? "control_first" : "experiment_first";
            }

            const response = await fetch("/api/participant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    conditionOrder,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create participant");
            }

            const participant = await response.json();

            // Store participant info in sessionStorage
            sessionStorage.setItem("participantId", participant.id);
            sessionStorage.setItem("participantCode", participant.participantId);
            sessionStorage.setItem("conditionOrder", participant.conditionOrder);

            router.push("/trial");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            <div className="max-w-xl mx-auto px-6 py-12">
                <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700 shadow-xl">
                    <h1 className="text-2xl font-bold text-center mb-2">Study Setup</h1>
                    <p className="text-gray-400 text-center mb-8">
                        Researcher: please complete this form with the participant
                    </p>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Participant ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Participant ID <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="participantId"
                                value={formData.participantId}
                                onChange={handleChange}
                                required
                                placeholder="e.g., P001"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400"
                            />
                        </div>

                        {/* Condition Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Condition Order
                            </label>
                            <select
                                name="conditionOrder"
                                value={formData.conditionOrder}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="auto">Auto (counterbalance)</option>
                                <option value="control_first">Control → Experiment</option>
                                <option value="experiment_first">Experiment → Control</option>
                            </select>
                            {formData.conditionOrder === "auto" && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Next participant will get: {participantCount % 2 === 0 ? "Control first" : "Experiment first"}
                                </p>
                            )}
                        </div>

                        <hr className="border-gray-700" />

                        <h2 className="text-lg font-medium text-gray-200">Demographics</h2>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Age
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                min="18"
                                max="100"
                                placeholder="Enter age"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400"
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Gender <span className="text-gray-500">(optional)</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Prefer not to say</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Education Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Education Level
                            </label>
                            <select
                                name="educationLevel"
                                value={formData.educationLevel}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select...</option>
                                <option value="high_school">High School</option>
                                <option value="some_college">Some College</option>
                                <option value="bachelors">Bachelor&apos;s Degree</option>
                                <option value="masters">Master&apos;s Degree</option>
                                <option value="doctorate">Doctorate</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Tech Adaptation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                How comfortable are you with new technology? (1-7)
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, techAdaptation: String(num) }))}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-all
                      ${formData.techAdaptation === String(num)
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Not at all</span>
                                <span>Very comfortable</span>
                            </div>
                        </div>

                        {/* Speaking Anxiety */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                How anxious do you typically feel about speaking? (1-7)
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, speakingAnx: String(num) }))}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-all
                      ${formData.speakingAnx === String(num)
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Not anxious</span>
                                <span>Very anxious</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.participantId}
                            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all
                ${isSubmitting || !formData.participantId
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/30"
                                }`}
                        >
                            {isSubmitting ? "Setting up..." : "Begin Study →"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
