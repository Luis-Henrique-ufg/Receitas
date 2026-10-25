import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import * as videoPlayerService from "@/services/videoPlayer";
import { statsApi } from "@/services/statsApi";

vi.mock("@/services/videoPlayer", () => ({
  completeLesson: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/statsApi", () => ({
  statsApi: {
    recordHeartbeat: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useProgressTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks time updates and triggers onTimeUpdate periodically", () => {
    const onTimeUpdate = vi.fn();
    const isEnding = vi.fn();

    const { result } = renderHook(() =>
      useProgressTracker({
        lessonId: 1,
        apiUrl: "http://localhost:9823",
        onTimeUpdate,
        isEnding,
      })
    );

    act(() => {
      // Time update at 10s is not > 10
      result.current.handleTimeUpdate(10, 100);
    });
    expect(onTimeUpdate).not.toHaveBeenCalled();

    act(() => {
      // Time update at 20s (> 10 and multiple of 10)
      result.current.handleTimeUpdate(20, 100);
    });
    expect(onTimeUpdate).toHaveBeenCalledWith(20);
  });

  it("tracks study heartbeat when >= 5 seconds accumulated", () => {
    const { result } = renderHook(() =>
      useProgressTracker({
        lessonId: 1,
        apiUrl: "http://localhost:9823",
      })
    );

    act(() => {
      result.current.handleTimeUpdate(1, 100);
      result.current.handleTimeUpdate(2, 100);
      result.current.handleTimeUpdate(3, 100);
      result.current.handleTimeUpdate(4, 100);
      result.current.handleTimeUpdate(5, 100);
      result.current.handleTimeUpdate(6, 100);
    });

    expect(statsApi.recordHeartbeat).toHaveBeenCalledWith(
      "http://localhost:9823",
      5,
      undefined,
      undefined
    );
  });


  it("triggers completion when progress reaches 95%", () => {
    const onTimeUpdate = vi.fn();
    const isEnding = vi.fn();

    const { result } = renderHook(() =>
      useProgressTracker({
        lessonId: 2,
        apiUrl: "http://localhost:9823",
        onTimeUpdate,
        isEnding,
      })
    );

    act(() => {
      result.current.handleTimeUpdate(95, 100);
    });

    expect(videoPlayerService.completeLesson).toHaveBeenCalledWith(
      "http://localhost:9823",
      2
    );
  });
});

