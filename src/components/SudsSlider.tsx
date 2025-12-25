"use client";

import { useState } from "react";

interface SudsSliderProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
}

export default function SudsSlider({
    value,
    onChange,
    label = "Rate your current anxiety level",
}: SudsSliderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const getColor = (val: number) => {
        if (val <= 30) return "from-emerald-500 to-green-500";
        if (val <= 60) return "from-yellow-500 to-orange-500";
        return "from-orange-500 to-red-500";
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <label className="block text-center text-gray-300 text-lg font-medium">
                {label}
            </label>

            {/* Large number display */}
            <div
                className={`text-8xl font-bold text-center transition-all duration-300 ${isDragging ? "scale-110" : "scale-100"
                    }`}
            >
                <span
                    className={`bg-gradient-to-r ${getColor(value)} bg-clip-text text-transparent`}
                >
                    {value}
                </span>
            </div>

            {/* Scale labels */}
            <div className="flex justify-between text-sm text-gray-400 px-1">
                <span>0 — No distress</span>
                <span>100 — Extreme distress</span>
            </div>

            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer bg-gray-700
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-8
            [&::-webkit-slider-thumb]:h-8
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-4
            [&::-webkit-slider-thumb]:border-gray-900
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-8
            [&::-moz-range-thumb]:h-8
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-4
            [&::-moz-range-thumb]:border-gray-900"
                    style={{
                        background: `linear-gradient(to right, 
              #10b981 0%, 
              #eab308 50%, 
              #ef4444 100%)`,
                    }}
                />
            </div>

            {/* Visual scale */}
            <div className="flex justify-between text-xs text-gray-500">
                {[0, 25, 50, 75, 100].map((mark) => (
                    <span key={mark} className="w-8 text-center">
                        {mark}
                    </span>
                ))}
            </div>
        </div>
    );
}
