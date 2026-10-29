import axios from "axios";

export interface SyncSummary {
  days_synced: number;
  lessons_updated: number;
  notes_added: number;
  subjects_synced: number;
  events_synced: number;
  course_activities_synced?: number;
  subject_activities_synced?: number;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  two_way?: boolean;
  summary: SyncSummary;
}

export const syncApi = {
  /**
   * Directly downloads the sync backup JSON file via browser.
   */
  downloadBackupUrl(apiUrl = ""): string {
    const base = apiUrl.replace(/\/+$/, "");
    return `${base}/api/sync/export?download=true`;
  },

  /**
   * Fetches JSON sync payload.
   */
  async exportData(apiUrl = ""): Promise<unknown> {
    const base = apiUrl.replace(/\/+$/, "");
    const res = await axios.get(`${base}/api/sync/export`);
    return res.data;
  },

  /**
   * Uploads a .json sync file from another device and merges it.
   */
  async uploadFile(apiUrl = "", file: File): Promise<SyncResponse> {
    const base = apiUrl.replace(/\/+$/, "");
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post<SyncResponse>(`${base}/api/sync/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  /**
   * Imports raw JSON payload and merges it.
   */
  async importPayload(apiUrl = "", payload: unknown): Promise<SyncResponse> {
    const base = apiUrl.replace(/\/+$/, "");
    const res = await axios.post<SyncResponse>(`${base}/api/sync/import`, payload);
    return res.data;
  },

  /**
   * Connects to another device on the Wi-Fi network and executes bidirectional sync.
   */
  async peerSync(apiUrl = "", remoteUrl: string): Promise<SyncResponse> {
    const base = apiUrl.replace(/\/+$/, "");
    const res = await axios.post<SyncResponse>(`${base}/api/sync/peer`, {
      remote_url: remoteUrl,
    });
    return res.data;
  },
};
