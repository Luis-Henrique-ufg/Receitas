export type SyncPhase =
  | "idle"
  | "drag_hover"
  | "importing_file"
  | "peer_connecting"
  | "peer_syncing"
  | "success"
  | "error";

export interface SyncMachineContext {
  phase: SyncPhase;
  remoteUrl: string;
  errorMessage: string | null;
}

export type SyncMachineEvent =
  | { type: "DRAG_ENTER" }
  | { type: "DRAG_LEAVE" }
  | { type: "START_FILE_IMPORT"; file: File }
  | { type: "START_PEER_SYNC"; remoteUrl: string }
  | { type: "PEER_CONNECTED" }
  | { type: "SYNC_SUCCESS" }
  | { type: "SYNC_ERROR"; error: string }
  | { type: "RESET" };

/**
 * Pure transition function for Sync State Machine.
 */
export function syncTransition(
  currentPhase: SyncPhase,
  event: SyncMachineEvent
): SyncPhase {
  switch (event.type) {
    case "DRAG_ENTER":
      return currentPhase === "idle" ? "drag_hover" : currentPhase;

    case "DRAG_LEAVE":
      return currentPhase === "drag_hover" ? "idle" : currentPhase;

    case "START_FILE_IMPORT":
      return "importing_file";

    case "START_PEER_SYNC":
      return "peer_connecting";

    case "PEER_CONNECTED":
      return currentPhase === "peer_connecting" ? "peer_syncing" : currentPhase;

    case "SYNC_SUCCESS":
      return "success";

    case "SYNC_ERROR":
      return "error";

    case "RESET":
      return "idle";

    default:
      return currentPhase;
  }
}

export const syncQueries = {
  isBusy(phase: SyncPhase): boolean {
    return (
      phase === "importing_file" ||
      phase === "peer_connecting" ||
      phase === "peer_syncing"
    );
  },
  canInitiateSync(phase: SyncPhase): boolean {
    return phase === "idle" || phase === "success" || phase === "error";
  },
};
