"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AudioWaveformProps {
    stream?: MediaStream | null;
    isRecording: boolean;
}

export default function AudioWaveform({ stream, isRecording }: AudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const [bars] = useState<number[]>(Array(40).fill(5));

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const analyzer = analyzerRef.current;
        if (!canvas || !analyzer) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyzer.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / bars.length;
        const barGap = 2;

        ctx.clearRect(0, 0, width, height);

        // Calculate bar heights from frequency data
        const step = Math.floor(bufferLength / bars.length);
        for (let i = 0; i < bars.length; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const average = sum / step;
            const barHeight = Math.max(4, (average / 255) * height * 0.9);

            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(
                0,
                height / 2 - barHeight / 2,
                0,
                height / 2 + barHeight / 2
            );
            gradient.addColorStop(0, "#ef4444");
            gradient.addColorStop(0.5, "#f97316");
            gradient.addColorStop(1, "#ef4444");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(
                i * barWidth + barGap / 2,
                height / 2 - barHeight / 2,
                barWidth - barGap,
                barHeight,
                3
            );
            ctx.fill();
        }

        animationRef.current = requestAnimationFrame(draw);
    }, [bars.length]);

    useEffect(() => {
        if (!stream || !isRecording) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            // Draw idle state
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    const width = canvas.width;
                    const height = canvas.height;
                    const barWidth = width / bars.length;
                    const barGap = 2;
                    ctx.clearRect(0, 0, width, height);
                    for (let i = 0; i < bars.length; i++) {
                        ctx.fillStyle = "#374151";
                        ctx.beginPath();
                        ctx.roundRect(
                            i * barWidth + barGap / 2,
                            height / 2 - 2,
                            barWidth - barGap,
                            4,
                            2
                        );
                        ctx.fill();
                    }
                }
            }
            return;
        }

        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            draw();

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                audioContext.close();
            };
        } catch (err) {
            console.error("Failed to create audio analyser:", err);
        }
    }, [stream, isRecording, draw, bars.length]);

    return (
        <div className="w-full max-w-md mx-auto">
            <canvas
                ref={canvasRef}
                width={400}
                height={100}
                className="w-full h-24"
            />
        </div>
    );
}
