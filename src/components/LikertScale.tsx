"use client";

import { useState } from "react";

interface LikertScaleProps {
    question: string;
    value: number | null;
    onChange: (value: number) => void;
    minLabel?: string;
    maxLabel?: string;
    scale?: number;
}

export default function LikertScale({
    question,
    value,
    onChange,
    minLabel = "Strongly Disagree",
    maxLabel = "Strongly Agree",
    scale = 7,
}: LikertScaleProps) {
    const [hoveredValue, setHoveredValue] = useState<number | null>(null);

    const options = Array.from({ length: scale }, (_, i) => i + 1);

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <p className="text-center text-gray-200 font-medium">{question}</p>

            <div className="flex justify-between text-xs text-gray-400 px-2">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>

            <div className="flex justify-center gap-2">
                {options.map((num) => (
                    <button
                        key={num}
                        onClick={() => onChange(num)}
                        onMouseEnter={() => setHoveredValue(num)}
                        onMouseLeave={() => setHoveredValue(null)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all duration-200
              ${value === num
                                ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30"
                                : hoveredValue === num
                                    ? "bg-gray-600 text-white scale-105"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                    >
                        {num}
                    </button>
                ))}
            </div>

            {value && (
                <p className="text-center text-sm text-gray-400">
                    Selected: <span className="text-blue-400 font-medium">{value}</span>
                </p>
            )}
        </div>
    );
}
