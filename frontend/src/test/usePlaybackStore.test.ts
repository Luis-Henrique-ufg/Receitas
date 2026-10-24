import { describe, it, expect, beforeEach } from "vitest";
import usePlaybackStore from "@/store/usePlaybackStore";

describe("usePlaybackStore Zen Mode", () => {
  beforeEach(() => {
    usePlaybackStore.setState({ isZenMode: false });
  });

  it("toggles zen mode on and off", () => {
    expect(usePlaybackStore.getState().isZenMode).toBe(false);

    usePlaybackStore.getState().toggleZenMode(true);
    expect(usePlaybackStore.getState().isZenMode).toBe(true);

    usePlaybackStore.getState().toggleZenMode(false);
    expect(usePlaybackStore.getState().isZenMode).toBe(false);

    usePlaybackStore.getState().toggleZenMode();
    expect(usePlaybackStore.getState().isZenMode).toBe(true);

    usePlaybackStore.getState().toggleZenMode();
    expect(usePlaybackStore.getState().isZenMode).toBe(false);
  });
});
