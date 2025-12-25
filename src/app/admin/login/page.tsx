"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passcode }),
            });

            if (response.ok) {
                router.push("/admin");
            } else {
                setError("Invalid passcode");
            }
        } catch {
            setError("Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
            <div className="w-full max-w-sm mx-auto px-6">
                <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700 shadow-xl">
                    <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Passcode
                            </label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter admin passcode"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400 text-center text-lg tracking-widest"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !passcode}
                            className={`w-full py-3 rounded-xl font-semibold transition-all
                ${isLoading || !passcode
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-500"
                                }`}
                        >
                            {isLoading ? "Authenticating..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
