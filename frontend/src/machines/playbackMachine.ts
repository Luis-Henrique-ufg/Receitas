export type PlaybackPhase =
  | "unloaded"
  | "initializing"
  | "ready_paused"
  | "playing"
  | "seeking"
  | "completing"
  | "navigating";

export interface PlaybackMachineContext {
  hasSource: boolean;
  isPlaying: boolean;
  isSeeking: boolean;
  isCompleting: boolean;
  isNavigating: boolean;
}

export type PlaybackMachineEvent =
  | { type: "LOAD_SOURCE"; src: string }
  | { type: "MEDIA_READY" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "START_SEEK"; target: number }
  | { type: "SEEK_COMPLETE" }
  | { type: "TRIGGER_COMPLETE" }
  | { type: "START_NAVIGATE"; direction: "next" | "previous" }
  | { type: "NAVIGATE_COMPLETE" }
  | { type: "UNLOAD" };

/**
 * Derives explicit playback phase from context flags.
 */
export function resolvePlaybackPhase(ctx: PlaybackMachineContext): PlaybackPhase {
  if (!ctx.hasSource) {
    return "unloaded";
  }
  if (ctx.isNavigating) {
    return "navigating";
  }
  if (ctx.isCompleting) {
    return "completing";
  }
  if (ctx.isSeeking) {
    return "seeking";
  }
  if (ctx.isPlaying) {
    return "playing";
  }
  return "ready_paused";
}

/**
 * Pure transition function for Playback State Machine.
 */
export function playbackTransition(
  currentPhase: PlaybackPhase,
  event: PlaybackMachineEvent
): PlaybackPhase {
  switch (event.type) {
    case "LOAD_SOURCE":
      return "initializing";

    case "MEDIA_READY":
      return "ready_paused";

    case "PLAY":
      if (currentPhase === "ready_paused" || currentPhase === "seeking") {
        return "playing";
      }
      return currentPhase;

    case "PAUSE":
      if (currentPhase === "playing") {
        return "ready_paused";
      }
      return currentPhase;

    case "START_SEEK":
      return "seeking";

    case "SEEK_COMPLETE":
      return "ready_paused";

    case "TRIGGER_COMPLETE":
      return "completing";

    case "START_NAVIGATE":
      return "navigating";

    case "NAVIGATE_COMPLETE":
      return "ready_paused";

    case "UNLOAD":
      return "unloaded";

    default:
      return currentPhase;
  }
}

export const playbackQueries = {
  isActivelyPlaying(phase: PlaybackPhase): boolean {
    return phase === "playing";
  },
  canPlay(phase: PlaybackPhase): boolean {
    return phase === "ready_paused" || phase === "seeking";
  },
  canPause(phase: PlaybackPhase): boolean {
    return phase === "playing";
  },
  canSeek(phase: PlaybackPhase): boolean {
    return phase === "playing" || phase === "ready_paused";
  },
  isTransitioning(phase: PlaybackPhase): boolean {
    return phase === "completing" || phase === "navigating" || phase === "initializing";
  },
};
