export type PomodoroPhase =
  | "idle"
  | "running_focus"
  | "paused_focus"
  | "overtime_focus"
  | "running_break"
  | "paused_break"
  | "inactivity_prompt"
  | "session_summary";

export type PomodoroMode = "focus" | "short_break" | "long_break";

export interface PomodoroMachineContext {
  mode: PomodoroMode;
  isRunning: boolean;
  isOvertime: boolean;
  startedAt: number | null;
  hasInactivityNotice: boolean;
  hasSummary: boolean;
}

export type PomodoroMachineEvent =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "ENTER_OVERTIME" }
  | { type: "PROMPT_INACTIVITY" }
  | { type: "RESOLVE_INACTIVITY"; resume: boolean }
  | { type: "STOP_SESSION" }
  | { type: "DISMISS_SUMMARY" }
  | { type: "SET_MODE"; mode: PomodoroMode };

/**
 * Derives the current explicit phase from context flags.
 * Guarantees zero invalid states and complete deterministic resolution.
 */
export function resolvePomodoroPhase(ctx: PomodoroMachineContext): PomodoroPhase {
  if (ctx.hasInactivityNotice) {
    return "inactivity_prompt";
  }

  if (ctx.hasSummary) {
    return "session_summary";
  }

  if (ctx.mode === "focus") {
    if (ctx.isOvertime) {
      return "overtime_focus";
    }
    if (ctx.isRunning) {
      return "running_focus";
    }
    if (ctx.startedAt !== null) {
      return "paused_focus";
    }
    return "idle";
  }

  // Break mode (short_break or long_break)
  if (ctx.isRunning) {
    return "running_break";
  }
  if (ctx.startedAt !== null) {
    return "paused_break";
  }
  return "idle";
}

/**
 * Pure transition function for the Pomodoro state machine.
 */
export function pomodoroTransition(
  currentPhase: PomodoroPhase,
  event: PomodoroMachineEvent
): PomodoroPhase {
  switch (event.type) {
    case "START":
    case "RESUME":
      if (currentPhase === "idle" || currentPhase === "paused_focus") {
        return "running_focus";
      }
      if (currentPhase === "paused_break") {
        return "running_break";
      }
      return currentPhase;

    case "PAUSE":
      if (currentPhase === "running_focus" || currentPhase === "overtime_focus") {
        return "paused_focus";
      }
      if (currentPhase === "running_break") {
        return "paused_break";
      }
      return currentPhase;

    case "ENTER_OVERTIME":
      if (currentPhase === "running_focus") {
        return "overtime_focus";
      }
      return currentPhase;

    case "PROMPT_INACTIVITY":
      return "inactivity_prompt";

    case "RESOLVE_INACTIVITY":
      return event.resume ? "running_focus" : "idle";

    case "STOP_SESSION":
      return "session_summary";

    case "DISMISS_SUMMARY":
    case "RESET":
      return "idle";

    case "SET_MODE":
      if (event.mode === "focus") {
        return "idle";
      }
      return "idle";

    default:
      return currentPhase;
  }
}

/** Helper inspection methods for DX & AX */
export const pomodoroQueries = {
  isFocus(phase: PomodoroPhase): boolean {
    return phase === "running_focus" || phase === "paused_focus" || phase === "overtime_focus";
  },
  isBreak(phase: PomodoroPhase): boolean {
    return phase === "running_break" || phase === "paused_break";
  },
  isActive(phase: PomodoroPhase): boolean {
    return phase === "running_focus" || phase === "overtime_focus" || phase === "running_break";
  },
  isPaused(phase: PomodoroPhase): boolean {
    return phase === "paused_focus" || phase === "paused_break";
  },
  canStart(phase: PomodoroPhase): boolean {
    return phase === "idle" || phase === "paused_focus" || phase === "paused_break";
  },
  canPause(phase: PomodoroPhase): boolean {
    return phase === "running_focus" || phase === "overtime_focus" || phase === "running_break";
  },
  canStop(phase: PomodoroPhase): boolean {
    return phase === "running_focus" || phase === "overtime_focus" || phase === "paused_focus";
  },
};
