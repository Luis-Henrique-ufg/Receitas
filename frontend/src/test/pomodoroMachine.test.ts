import { describe, it, expect } from "vitest";
import {
  resolvePomodoroPhase,
  pomodoroTransition,
  pomodoroQueries,
} from "@/machines/pomodoroMachine";

describe("Pomodoro State Machine", () => {
  it("resolves idle phase by default", () => {
    const phase = resolvePomodoroPhase({
      mode: "focus",
      isRunning: false,
      isOvertime: false,
      startedAt: null,
      hasInactivityNotice: false,
      hasSummary: false,
    });
    expect(phase).toBe("idle");
    expect(pomodoroQueries.canStart(phase)).toBe(true);
    expect(pomodoroQueries.canPause(phase)).toBe(false);
  });

  it("resolves running_focus and overtime_focus correctly", () => {
    const running = resolvePomodoroPhase({
      mode: "focus",
      isRunning: true,
      isOvertime: false,
      startedAt: Date.now(),
      hasInactivityNotice: false,
      hasSummary: false,
    });
    expect(running).toBe("running_focus");
    expect(pomodoroQueries.isActive(running)).toBe(true);

    const overtime = resolvePomodoroPhase({
      mode: "focus",
      isRunning: true,
      isOvertime: true,
      startedAt: Date.now() - 25 * 60 * 1000,
      hasInactivityNotice: false,
      hasSummary: false,
    });
    expect(overtime).toBe("overtime_focus");
    expect(pomodoroQueries.isActive(overtime)).toBe(true);
    expect(pomodoroQueries.isFocus(overtime)).toBe(true);
  });

  it("handles transitions between running, pause, and stop deterministically", () => {
    let phase = pomodoroTransition("idle", { type: "START" });
    expect(phase).toBe("running_focus");

    phase = pomodoroTransition(phase, { type: "PAUSE" });
    expect(phase).toBe("paused_focus");
    expect(pomodoroQueries.isPaused(phase)).toBe(true);

    phase = pomodoroTransition(phase, { type: "RESUME" });
    expect(phase).toBe("running_focus");

    phase = pomodoroTransition(phase, { type: "ENTER_OVERTIME" });
    expect(phase).toBe("overtime_focus");

    phase = pomodoroTransition(phase, { type: "STOP_SESSION" });
    expect(phase).toBe("session_summary");

    phase = pomodoroTransition(phase, { type: "DISMISS_SUMMARY" });
    expect(phase).toBe("idle");
  });

  it("prioritizes inactivity notice modal over background ticking", () => {
    const phase = resolvePomodoroPhase({
      mode: "focus",
      isRunning: true,
      isOvertime: false,
      startedAt: Date.now(),
      hasInactivityNotice: true,
      hasSummary: false,
    });
    expect(phase).toBe("inactivity_prompt");
  });
});
