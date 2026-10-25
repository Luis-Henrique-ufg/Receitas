import axios from "axios";

export interface HeatmapDay {
  date: string;
  study_seconds: number;
  pomodoros: number;
  lessons: number;
  level: number;
}

export interface HeatmapResponse {
  current_streak: number;
  max_streak: number;
  total_seconds: number;
  total_pomodoros: number;
  total_lessons: number;
  days: HeatmapDay[];
}

function resolveUrl(apiUrl?: string, path: string = ""): string {
  const base = (apiUrl || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export const statsApi = {
  async getHeatmap(apiUrl?: string, days: number = 180): Promise<HeatmapResponse> {
    const url = resolveUrl(apiUrl, `/api/stats/heatmap?days=${days}`);
    const res = await axios.get<HeatmapResponse>(url);
    return res.data;
  },

  async recordPomodoro(apiUrl?: string, studySeconds: number = 1500): Promise<void> {
    const url = resolveUrl(apiUrl, "/api/stats/pomodoro");
    await axios.post(url, { study_seconds: studySeconds });
  },

  async recordHeartbeat(apiUrl?: string, seconds: number): Promise<void> {
    if (seconds <= 0) return;
    const url = resolveUrl(apiUrl, "/api/stats/heartbeat");
    await axios.post(url, { seconds });
  },
};

