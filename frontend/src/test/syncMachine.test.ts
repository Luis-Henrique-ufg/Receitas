import { describe, it, expect } from "vitest";
import { syncTransition, syncQueries } from "@/machines/syncMachine";

describe("Sync State Machine", () => {
  it("transitions between drag states cleanly", () => {
    let phase = syncTransition("idle", { type: "DRAG_ENTER" });
    expect(phase).toBe("drag_hover");

    phase = syncTransition(phase, { type: "DRAG_LEAVE" });
    expect(phase).toBe("idle");
  });

  it("handles peer sync connection and progress states", () => {
    let phase = syncTransition("idle", {
      type: "START_PEER_SYNC",
      remoteUrl: "192.168.0.10:9823",
    });
    expect(phase).toBe("peer_connecting");
    expect(syncQueries.isBusy(phase)).toBe(true);

    phase = syncTransition(phase, { type: "PEER_CONNECTED" });
    expect(phase).toBe("peer_syncing");
    expect(syncQueries.isBusy(phase)).toBe(true);

    phase = syncTransition(phase, { type: "SYNC_SUCCESS" });
    expect(phase).toBe("success");
    expect(syncQueries.isBusy(phase)).toBe(false);
    expect(syncQueries.canInitiateSync(phase)).toBe(true);
  });

  it("handles error state and reset", () => {
    let phase = syncTransition("peer_connecting", {
      type: "SYNC_ERROR",
      error: "Connection refused",
    });
    expect(phase).toBe("error");

    phase = syncTransition(phase, { type: "RESET" });
    expect(phase).toBe("idle");
  });
});
