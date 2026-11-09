import { describe, it, expect } from "vitest";
import {
  resolvePlaybackPhase,
  playbackTransition,
  playbackQueries,
} from "@/machines/playbackMachine";

describe("Playback State Machine", () => {
  it("resolves unloaded when no source exists", () => {
    const phase = resolvePlaybackPhase({
      hasSource: false,
      isPlaying: false,
      isSeeking: false,
      isCompleting: false,
      isNavigating: false,
    });
    expect(phase).toBe("unloaded");
    expect(playbackQueries.canPlay(phase)).toBe(false);
  });

  it("resolves ready_paused and playing correctly", () => {
    const paused = resolvePlaybackPhase({
      hasSource: true,
      isPlaying: false,
      isSeeking: false,
      isCompleting: false,
      isNavigating: false,
    });
    expect(paused).toBe("ready_paused");
    expect(playbackQueries.canPlay(paused)).toBe(true);

    const playing = resolvePlaybackPhase({
      hasSource: true,
      isPlaying: true,
      isSeeking: false,
      isCompleting: false,
      isNavigating: false,
    });
    expect(playing).toBe("playing");
    expect(playbackQueries.isActivelyPlaying(playing)).toBe(true);
  });

  it("handles playback lifecycle transitions smoothly", () => {
    let phase = playbackTransition("unloaded", { type: "LOAD_SOURCE", src: "test.mp4" });
    expect(phase).toBe("initializing");

    phase = playbackTransition(phase, { type: "MEDIA_READY" });
    expect(phase).toBe("ready_paused");

    phase = playbackTransition(phase, { type: "PLAY" });
    expect(phase).toBe("playing");

    phase = playbackTransition(phase, { type: "START_SEEK", target: 45 });
    expect(phase).toBe("seeking");

    phase = playbackTransition(phase, { type: "SEEK_COMPLETE" });
    expect(phase).toBe("ready_paused");

    phase = playbackTransition(phase, { type: "TRIGGER_COMPLETE" });
    expect(phase).toBe("completing");

    phase = playbackTransition(phase, { type: "START_NAVIGATE", direction: "next" });
    expect(phase).toBe("navigating");

    phase = playbackTransition(phase, { type: "NAVIGATE_COMPLETE" });
    expect(phase).toBe("ready_paused");
  });
});
