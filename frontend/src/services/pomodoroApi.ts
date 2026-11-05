import axios from "axios";

export interface PomodoroSessionItem {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number;
  pomodoros: number;
  subject_id: number | null;
  subject_name: string;
  subject_color: string;
  intention: string | null;
  course_id: number | null;
  course_name: string | null;
  created_at: string | null;
}

function resolveUrl(apiUrl?: string, path: string = ""): string {
  const base = (apiUrl || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export const pomodoroApi = {
  async getSessions(apiUrl?: string, dateStr?: string): Promise<PomodoroSessionItem[]> {
    const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : "";
    const url = resolveUrl(apiUrl, `/api/pomodoro/sessions${query}`);
    const res = await axios.get<PomodoroSessionItem[]>(url);
    return res.data;
  },

  async updateSession(
    apiUrl: string | undefined,
    sessionId: number,
    data: { subject_id?: number | null; intention?: string | null }
  ): Promise<PomodoroSessionItem> {
    const url = resolveUrl(apiUrl, `/api/pomodoro/sessions/${sessionId}`);
    const res = await axios.patch<PomodoroSessionItem>(url, data);
    return res.data;
  },

  async deleteSession(apiUrl: string | undefined, sessionId: number): Promise<void> {
    const url = resolveUrl(apiUrl, `/api/pomodoro/sessions/${sessionId}`);
    await axios.delete(url);
  },
};

