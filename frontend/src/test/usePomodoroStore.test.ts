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
      sessionsCompleted: 0,
      soundEnabled: true,
      autoPauseVideo: true,
      durations: { focus: 25, short_break: 5, long_break: 15 },
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
    usePomodoroStore.setState({ timeLeft: 50 });
    usePomodoroStore.getState().reset();
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60);
  });

  it("switches modes properly", () => {
    usePomodoroStore.getState().setMode("short_break");
    expect(usePomodoroStore.getState().mode).toBe("short_break");
    expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60);

    usePomodoroStore.getState().setMode("long_break");
    expect(usePomodoroStore.getState().mode).toBe("long_break");
    expect(usePomodoroStore.getState().timeLeft).toBe(15 * 60);
  });

  it("decrements timeLeft on tick when running", () => {
    usePomodoroStore.getState().start();
    usePomodoroStore.getState().tick("http://localhost:9823");
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60 - 1);
  });

  it("handles cycle completion when timer reaches zero", () => {
    usePomodoroStore.setState({ isRunning: true, timeLeft: 1, mode: "focus" });
    usePomodoroStore.getState().tick("http://localhost:9823");

    expect(usePomodoroStore.getState().sessionsCompleted).toBe(1);
    expect(usePomodoroStore.getState().mode).toBe("short_break");
    expect(usePomodoroStore.getState().isRunning).toBe(false);
    expect(statsApi.recordPomodoro).toHaveBeenCalledWith(
      "http://localhost:9823",
      25 * 60,
      undefined,
      undefined
    );
  });

  it("records pomodoro even when apiUrl is an empty string", () => {
    usePomodoroStore.setState({ isRunning: true, timeLeft: 1, mode: "focus" });
    usePomodoroStore.getState().tick("");

    expect(statsApi.recordPomodoro).toHaveBeenCalledWith("", 25 * 60, undefined, undefined);
  });

  it("passes course context when currentCourse is set", () => {
    usePomodoroStore.getState().setCurrentCourse(42, "Estatística");
    usePomodoroStore.setState({ isRunning: true, timeLeft: 1, mode: "focus" });
    usePomodoroStore.getState().tick("http://localhost:9823");

    expect(statsApi.recordPomodoro).toHaveBeenCalledWith(
      "http://localhost:9823",
      25 * 60,
      42,
      "Estatística"
    );
  });
});


