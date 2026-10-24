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

export const statsApi = {
  async getHeatmap(apiUrl: string, days: number = 180): Promise<HeatmapResponse> {
    const res = await axios.get<HeatmapResponse>(`${apiUrl}/api/stats/heatmap?days=${days}`);
    return res.data;
  },

  async recordPomodoro(apiUrl: string, studySeconds: number = 1500): Promise<void> {
    await axios.post(`${apiUrl}/api/stats/pomodoro`, { study_seconds: studySeconds });
  },

  async recordHeartbeat(apiUrl: string, seconds: number): Promise<void> {
    await axios.post(`${apiUrl}/api/stats/heartbeat`, { seconds });
  },
};
