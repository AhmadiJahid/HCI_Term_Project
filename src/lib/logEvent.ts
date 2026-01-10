// Client-side event logging utility
export interface LogEventParams {
    participantId: string;
    trialId?: string;
    eventName: string;
    metadata?: Record<string, unknown>;
}

export async function logEvent(params: LogEventParams): Promise<void> {
    try {
        await fetch("/api/log-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                participantId: params.participantId,
                trialId: params.trialId,
                eventName: params.eventName,
                metadata: params.metadata || {},
            }),
        });
    } catch (error) {
        console.error("Failed to log event:", error);
    }
}

// Event name constants for consistency
export const EVENTS = {
    ENTER_SUDS_PRE: "enter_suds_pre",
    SUBMIT_SUDS_PRE: "submit_suds_pre",
    START_RECORDING: "start_recording",
    STOP_RECORDING: "stop_recording",
    PLAY_AUDIO: "play_audio",
    TOGGLE_TEXT_ONLY: "toggle_text_only",
    VISIT_TAB: "visit_tab",
    SUBMIT_SUDS_POST: "submit_suds_post",
    RECORD_AGAIN: "record_again",
    ENTER_REVIEW: "enter_review",
    LEAVE_REVIEW: "leave_review",
    SHOW_MOTIVATIONAL_PROMPT: "show_motivational_prompt",
} as const;
