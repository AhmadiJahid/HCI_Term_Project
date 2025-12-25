"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ReviewExperimentProps {
    audioUrl: string;
    audioDuration?: number;
    transcript: string | null;
    coachData: {
        strength: string | null;
        tip: string | null;
        reframe: string | null;
    } | null;
    stats: {
        wordCount: number | null;
        fillerCount: number | null;
        wpm: number | null;
    } | null;
    isLoading: boolean;
    onRecordAgain: () => void;
    onContinue: () => void;
    onAudioPlay?: () => void;
    onTabVisit?: (tab: string) => void;
    onTextOnlyToggle?: (enabled: boolean) => void;
    onRetry?: () => void;
}

type TabType = "transcript" | "coach" | "stats";

export default function ReviewExperiment({
    audioUrl,
    audioDuration,
    transcript,
    coachData,
    stats,
    isLoading,
    onRecordAgain,
    onContinue,
    onAudioPlay,
    onTabVisit,
    onTextOnlyToggle,
    onRetry,
}: ReviewExperimentProps) {
    const [activeTab, setActiveTab] = useState<TabType>("transcript");
    const [textOnlyMode, setTextOnlyMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(audioDuration || 0);
    const hasPlayedRef = useRef(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barHeightsRef = useRef<number[]>([]);
    const animationRef = useRef<number | null>(null);

    // Draw waveform visualization with clipping for smooth progress
    const drawWaveform = useCallback((progress = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Use CSS size for width/height (Hi-DPI aware)
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Dynamic bar count based on width for consistent density
        const barCount = Math.max(80, Math.min(300, Math.floor(width / 3)));
        const barWidth = width / barCount;
        const barGap = 2;

        // Generate heights once (so they don't re-randomize each frame)
        if (barHeightsRef.current.length !== barCount) {
            barHeightsRef.current = Array.from({ length: barCount }, (_, i) => {
                const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
                const randomHeight = ((seed - Math.floor(seed)) * 0.6 + 0.2) * height;
                return randomHeight;
            });
        }

        ctx.clearRect(0, 0, width, height);

        const drawBars = (fillStyle: string | CanvasGradient) => {
            ctx.fillStyle = fillStyle;
            for (let i = 0; i < barCount; i++) {
                const barHeight = barHeightsRef.current[i] || height * 0.5;
                ctx.beginPath();
                ctx.roundRect(
                    i * barWidth + barGap / 2,
                    height / 2 - barHeight / 2,
                    barWidth - barGap,
                    barHeight,
                    2
                );
                ctx.fill();
            }
        };

        // 1) Draw unplayed
        drawBars("#4b5563");

        // 2) Draw played clipped to progress
        const clipW = Math.max(0, Math.min(1, progress)) * width;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, clipW, height);
        ctx.clip();

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(0.5, "#60a5fa");
        gradient.addColorStop(1, "#3b82f6");

        drawBars(gradient);
        ctx.restore();
    }, []);

    // Start smooth animation loop
    const startAnimation = useCallback(() => {
        // Prevent multiple RAF loops
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const tick = () => {
            const audio = audioRef.current;
            if (!audio) return;

            const d =
                duration > 0
                    ? duration
                    : (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);

            const progress = d > 0 ? audio.currentTime / d : 0;
            drawWaveform(progress);

            animationRef.current = requestAnimationFrame(tick);
        };

        animationRef.current = requestAnimationFrame(tick);
    }, [drawWaveform, duration]);

    // Stop animation loop
    const stopAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    }, []);

    // React event callbacks - attached immediately on first render
    const onLoadedMetadata = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const d = audio.duration;
        if (Number.isFinite(d) && d > 0) setDuration(d);
        else if (audioDuration && audioDuration > 0) setDuration(audioDuration);
    }, [audioDuration]);

    const onDurationChange = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
        }
    }, []);

    const onPlay = useCallback(() => {
        setIsPlaying(true);
        startAnimation();
        if (!hasPlayedRef.current) {
            hasPlayedRef.current = true;
            onAudioPlay?.();
        }
    }, [startAnimation, onAudioPlay]);

    const onPause = useCallback(() => {
        setIsPlaying(false);
        stopAnimation();
    }, [stopAnimation]);

    const onEnded = useCallback(() => {
        setIsPlaying(false);
        stopAnimation();
        drawWaveform(1);
    }, [stopAnimation, drawWaveform]);

    const onTimeUpdate = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
    }, []);

    // Load audio when URL changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        setCurrentTime(0);
        hasPlayedRef.current = false;

        audio.currentTime = 0;
        audio.load();
    }, [audioUrl]);

    // Use passed duration as fallback
    useEffect(() => {
        if (audioDuration && audioDuration > 0 && duration === 0) {
            setDuration(audioDuration);
        }
    }, [audioDuration, duration]);

    // Hi-DPI canvas setup with ResizeObserver
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);

            // Draw using CSS pixels
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Reset bar heights when resizing
            barHeightsRef.current = [];
            drawWaveform(0);
        };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        return () => ro.disconnect();
    }, [drawWaveform]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        onTabVisit?.(tab);
    };

    const handleTextOnlyToggle = () => {
        const newState = !textOnlyMode;
        setTextOnlyMode(newState);
        onTextOnlyToggle?.(newState);
        if (newState && audioRef.current) {
            audioRef.current.pause();
        }
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) {
            console.error("Audio element not found");
            return;
        }

        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }
        } catch (error) {
            console.error("Audio playback error:", error);
            setIsPlaying(false);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !audioRef.current || duration === 0) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const newTime = progress * duration;

        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        drawWaveform(progress);
    };

    const formatTime = (time: number): string => {
        if (!Number.isFinite(time) || isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: "transcript", label: "Transcript", icon: "📝" },
        { id: "coach", label: "Coach", icon: "💬" },
        { id: "stats", label: "Stats", icon: "📊" },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold text-center text-gray-200">
                Safe Review Mode
            </h2>

            {/* Text-only toggle */}
            <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-gray-400">Text-only mode</span>
                <button
                    onClick={handleTextOnlyToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors ${textOnlyMode ? "bg-blue-600" : "bg-gray-600"
                        }`}
                >
                    <span
                        className={`absolute top-1 left-0 w-4 h-4 rounded-full bg-white transition-transform ${textOnlyMode ? "translate-x-6" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>

            {/* Audio player (hidden in text-only mode) */}
            {!textOnlyMode && (
                <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        preload="auto"
                        onLoadedMetadata={onLoadedMetadata}
                        onDurationChange={onDurationChange}
                        onPlay={onPlay}
                        onPause={onPause}
                        onEnded={onEnded}
                        onTimeUpdate={onTimeUpdate}
                    />

                    {/* Waveform visualization */}
                    <div className="mb-4">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-20 cursor-pointer rounded-lg"
                            onClick={handleSeek}
                        />
                    </div>

                    {/* Play/Pause button */}
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 
                              hover:from-blue-400 hover:to-blue-600 
                              flex items-center justify-center shadow-lg transition-all hover:scale-105"
                        >
                            {isPlaying ? (
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Time display */}
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors
              ${activeTab === tab.id
                                ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
                                : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[200px] bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="text-gray-400">Analyzing your recording...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === "transcript" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-200">📝 Transcript</h3>
                                {transcript ? (
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {transcript}
                                    </p>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <p className="text-gray-400">Transcript not available</p>
                                        {onRetry && (
                                            <button
                                                onClick={onRetry}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "coach" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-200">💬 Speaking Coach</h3>
                                {coachData?.strength || coachData?.tip || coachData?.reframe ? (
                                    <div className="space-y-4">
                                        {coachData.strength && (
                                            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                                                <h4 className="text-green-400 font-medium mb-2">✨ Strength</h4>
                                                <p className="text-gray-300">{coachData.strength}</p>
                                            </div>
                                        )}
                                        {coachData.tip && (
                                            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                                                <h4 className="text-blue-400 font-medium mb-2">💡 Actionable Tip</h4>
                                                <p className="text-gray-300">{coachData.tip}</p>
                                            </div>
                                        )}
                                        {coachData.reframe && (
                                            <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
                                                <h4 className="text-purple-400 font-medium mb-2">🔄 Reframe</h4>
                                                <p className="text-gray-300">{coachData.reframe}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <p className="text-gray-400">Coach feedback not available</p>
                                        {onRetry && (
                                            <button
                                                onClick={onRetry}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 text-center italic">
                                    This is general speaking practice feedback, not a clinical assessment.
                                </p>
                            </div>
                        )}

                        {activeTab === "stats" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-200">📊 Speaking Stats</h3>
                                {(stats?.wordCount !== null || stats?.wpm !== null || stats?.fillerCount !== null) ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-800 rounded-lg p-4 text-center">
                                            <div className="text-3xl font-bold text-blue-400">
                                                {stats?.wordCount ?? "—"}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">Words</div>
                                        </div>
                                        <div className="bg-gray-800 rounded-lg p-4 text-center">
                                            <div className="text-3xl font-bold text-green-400">
                                                {stats?.wpm != null ? Math.round(stats.wpm) : "—"}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">WPM</div>
                                        </div>
                                        <div className="bg-gray-800 rounded-lg p-4 text-center">
                                            <div className="text-3xl font-bold text-orange-400">
                                                {stats?.fillerCount ?? "—"}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">Fillers</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <p className="text-gray-400">Stats not available</p>
                                        {onRetry && (
                                            <button
                                                onClick={onRetry}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onRecordAgain}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium 
            transition-colors border border-gray-600"
                >
                    Record Again
                </button>
                <button
                    onClick={onContinue}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 
            hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium 
            transition-all shadow-lg shadow-green-900/30"
                >
                    Continue →
                </button>
            </div>
        </div>
    );
}
