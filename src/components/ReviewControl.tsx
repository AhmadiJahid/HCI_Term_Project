"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface ReviewControlProps {
    audioUrl: string;
    audioDuration?: number; // Pass duration from recording if available
    onRecordAgain: () => void;
    onContinue: () => void;
    onAudioPlay?: () => void;
}

export default function ReviewControl({
    audioUrl,
    audioDuration,
    onRecordAgain,
    onContinue,
    onAudioPlay,
}: ReviewControlProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(audioDuration || 0);
    const [isLoaded, setIsLoaded] = useState(false);
    const hasPlayedRef = useRef(false);
    const barHeightsRef = useRef<number[]>([]);

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

    // Ref for animation frame
    const animationRef = useRef<number | null>(null);

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
                    : (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);

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

        setIsLoaded(true);
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

    // Use passed duration as fallback
    useEffect(() => {
        if (audioDuration && audioDuration > 0 && duration === 0) {
            setDuration(audioDuration);
        }
    }, [audioDuration, duration]);

    // Load audio when URL changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        setIsLoaded(false);
        setCurrentTime(0);
        drawWaveform(0);
        hasPlayedRef.current = false;

        audio.currentTime = 0;
        audio.load();
    }, [audioUrl, drawWaveform]);

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
        if (!isFinite(time) || isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-8">
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
                <h3 className="text-lg font-medium text-gray-300 mb-4 text-center">
                    Review Your Recording
                </h3>

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
                        disabled={!isLoaded && duration === 0}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 
              hover:from-blue-400 hover:to-blue-600 
              flex items-center justify-center shadow-lg transition-all hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex justify-between text-sm text-gray-400 px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
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
