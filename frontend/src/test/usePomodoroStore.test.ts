import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { statsApi } from "@/services/statsApi";

vi.mock("@/services/statsApi", () => ({
  statsApi: {
    recordPomodoro: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/utils/sound", () => ({
  playChimeSound: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("usePomodoroStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePomodoroStore.setState({
      mode: "focus",
      timeLeft: 25 * 60,
      isRunning: false,
      isOvertime: false,
      overtimeSeconds: 0,
      startedAt: null,
      initialFocusDuration: 25 * 60,
      completionBehavior: "flow",
      sessionsCompleted: 0,
      soundEnabled: true,
      autoPauseVideo: false,
      durations: { focus: 25, short_break: 5, long_break: 15 },
      currentCourseId: null,
      currentCourseName: null,
      currentSubjectId: null,
      currentSubjectName: null,
      sessionSummary: null,
    });
  });

  it("toggles play and pause", () => {
    expect(usePomodoroStore.getState().isRunning).toBe(false);
    usePomodoroStore.getState().start();
    expect(usePomodoroStore.getState().isRunning).toBe(true);
    usePomodoroStore.getState().pause();
    expect(usePomodoroStore.getState().isRunning).toBe(false);
  });

  it("resets timer according to current mode", () => {
    usePomodoroStore.setState({ timeLeft: 50, isOvertime: true, overtimeSeconds: 120 });
    usePomodoroStore.getState().reset();
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60);
    expect(usePomodoroStore.getState().isOvertime).toBe(false);
    expect(usePomodoroStore.getState().overtimeSeconds).toBe(0);
  });

  it("switches modes properly", () => {
    usePomodoroStore.getState().setMode("short_break");
    expect(usePomodoroStore.getState().mode).toBe("short_break");
    expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60);

    usePomodoroStore.getState().setMode("long_break");
    expect(usePomodoroStore.getState().mode).toBe("long_break");
    expect(usePomodoroStore.getState().timeLeft).toBe(15 * 60);
  });

  it("decrements timeLeft on tick before reaching initial duration", () => {
    const startedAt = Date.now() - 10 * 1000; // 10s elapsed
    usePomodoroStore.setState({
      isRunning: true,
      startedAt,
      initialFocusDuration: 1500,
      mode: "focus",
    });
    usePomodoroStore.getState().tick("http://localhost:9823");
    expect(usePomodoroStore.getState().timeLeft).toBeLessThanOrEqual(1490);
    expect(usePomodoroStore.getState().isOvertime).toBe(false);
  });

  it("enters overtime flow when reaching 25:00 in flow mode", () => {
    // 25 min + 10s elapsed
    const startedAt = Date.now() - (25 * 60 + 10) * 1000;
    usePomodoroStore.setState({
      isRunning: true,
      startedAt,
      initialFocusDuration: 25 * 60,
      completionBehavior: "flow",
      mode: "focus",
      isOvertime: false,
    });

    usePomodoroStore.getState().tick("http://localhost:9823");

    expect(usePomodoroStore.getState().isOvertime).toBe(true);
    expect(usePomodoroStore.getState().overtimeSeconds).toBeGreaterThanOrEqual(10);
    expect(usePomodoroStore.getState().isRunning).toBe(true); // video and timer keep running!
  });

  it("stops and records flow session with earned pomodoros and subject", async () => {
    usePomodoroStore.getState().setCurrentSubject(10, "Estatística UFG");
    // 50 minutes elapsed in flow (2 pomodoros)
    usePomodoroStore.setState({
      startedAt: Date.now() - 50 * 60 * 1000,
      initialFocusDuration: 25 * 60,
      isOvertime: true,
      overtimeSeconds: 25 * 60,
      mode: "focus",
    });

    await usePomodoroStore.getState().stopAndRecord("http://localhost:9823");

    expect(statsApi.recordPomodoro).toHaveBeenCalledWith(
      "http://localhost:9823",
      expect.any(Number),
      undefined,
      undefined,
      10,
      "Estatística UFG",
      2
    );
    expect(usePomodoroStore.getState().sessionSummary).not.toBeNull();
    expect(usePomodoroStore.getState().sessionSummary?.pomodorosCount).toBe(2);
  });

  it("handles cycle completion in strict mode when timer reaches zero", () => {
    const startedAt = Date.now() - 25 * 60 * 1000;
    usePomodoroStore.setState({
      isRunning: true,
      startedAt,
      initialFocusDuration: 25 * 60,
      completionBehavior: "strict",
      mode: "focus",
      isOvertime: false,
    });

    usePomodoroStore.getState().tick("http://localhost:9823");

    expect(usePomodoroStore.getState().sessionsCompleted).toBe(1);
    expect(usePomodoroStore.getState().mode).toBe("short_break");
    expect(usePomodoroStore.getState().isRunning).toBe(false);
    expect(statsApi.recordPomodoro).toHaveBeenCalledWith(
      "http://localhost:9823",
      25 * 60,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it("does not count paused time when resumed after a pause", () => {
    // Start fresh
    usePomodoroStore.getState().start();
    expect(usePomodoroStore.getState().isRunning).toBe(true);

    // Simulate 5 minutes running
    const originalStartedAt = Date.now() - 5 * 60 * 1000;
    usePomodoroStore.setState({ startedAt: originalStartedAt });

    // User pauses
    usePomodoroStore.getState().pause();
    expect(usePomodoroStore.getState().isRunning).toBe(false);
    expect(usePomodoroStore.getState().startedAt).toBeNull();
    // 20 minutes remaining
    expect(usePomodoroStore.getState().timeLeft).toBe(20 * 60);

    // Simulate 30 minutes passing while paused, then user resumes
    usePomodoroStore.getState().start();
    expect(usePomodoroStore.getState().isRunning).toBe(true);

    // startedAt should now be ~5 minutes ago, NOT 35 minutes ago!
    const effectiveElapsed = Math.floor(
      (Date.now() - (usePomodoroStore.getState().startedAt || 0)) / 1000
    );
    expect(effectiveElapsed).toBe(5 * 60);

    // Tick should NOT trigger overtime, should maintain ~20 min remaining
    usePomodoroStore.getState().tick();
    expect(usePomodoroStore.getState().isOvertime).toBe(false);
    expect(usePomodoroStore.getState().timeLeft).toBeLessThanOrEqual(20 * 60);
    expect(usePomodoroStore.getState().timeLeft).toBeGreaterThanOrEqual(20 * 60 - 2);
  });
});
