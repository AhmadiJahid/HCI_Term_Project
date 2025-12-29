"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AudioWaveform from "./AudioWaveform";

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onRecordingStart?: () => void;
}

export default function AudioRecorder({
    onRecordingComplete,
    onRecordingStart,
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        // Check microphone permission on mount
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                setPermissionGranted(true);
                stream.getTracks().forEach((track) => track.stop());
            })
            .catch(() => {
                setPermissionGranted(false);
            });

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        setError(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/mp4",
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, {
                    type: mediaRecorder.mimeType,
                });
                console.log("Recorded blob type:", audioBlob.type);
                const duration = (Date.now() - startTimeRef.current) / 1000;
                stream.getTracks().forEach((track) => track.stop());
                setMediaStream(null);
                onRecordingComplete(audioBlob, duration);
            };

            mediaRecorderRef.current = mediaRecorder;
            startTimeRef.current = Date.now();
            mediaRecorder.start(1000);
            setIsRecording(true);
            setElapsedTime(0);

            if (onRecordingStart) {
                onRecordingStart();
            }

            timerRef.current = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        } catch (err) {
            console.error("Failed to start recording:", err);
            setError("Could not access microphone. Please allow microphone access.");
            setPermissionGranted(false);
        }
    }, [onRecordingComplete, onRecordingStart]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    if (permissionGranted === false) {
        return (
            <div className="text-center space-y-4">
                <div className="text-red-400 text-lg">
                    Microphone access is required for recording.
                </div>
                <button
                    onClick={() => {
                        navigator.mediaDevices
                            .getUserMedia({ audio: true })
                            .then((stream) => {
                                setPermissionGranted(true);
                                stream.getTracks().forEach((track) => track.stop());
                            })
                            .catch(() => setError("Permission denied"));
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                    Allow Microphone Access
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-6">
            {error && (
                <div className="bg-red-900/50 text-red-300 px-4 py-2 rounded-lg">
                    {error}
                </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
                <div className="flex items-center space-x-3">
                    <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
                    </span>
                    <span className="text-red-400 font-medium text-xl">Recording...</span>
                </div>
            )}

            {/* Waveform visualization */}
            <div className="w-full">
                <AudioWaveform stream={mediaStream} isRecording={isRecording} />
            </div>

            {/* Timer display */}
            <div
                className={`text-7xl font-mono font-bold transition-colors ${isRecording ? "text-red-400" : "text-gray-400"
                    }`}
            >
                {formatTime(elapsedTime)}
            </div>

            {/* Control button */}
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="group relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 
            hover:from-red-400 hover:to-red-600 shadow-lg shadow-red-900/50 
            transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <span className="absolute inset-4 rounded-full border-4 border-white/30"></span>
                    <span className="text-white text-xl font-bold">START</span>
                </button>
            ) : (
                <button
                    onClick={stopRecording}
                    className="group relative w-32 h-32 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 
            hover:from-gray-500 hover:to-gray-700 shadow-lg 
            transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <span className="absolute inset-4 flex items-center justify-center">
                        <span className="w-12 h-12 bg-white rounded-sm"></span>
                    </span>
                    <span className="absolute bottom-4 inset-x-0 text-white text-sm font-medium">
                        STOP
                    </span>
                </button>
            )}

            {!isRecording && elapsedTime === 0 && (
                <p className="text-gray-400 text-center">
                    Click the button above to start recording your response
                </p>
            )}
        </div>
    );
}
