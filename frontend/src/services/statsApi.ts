import axios from "axios";

export interface DayCourse {
  id: number;
  name: string;
  seconds: number;
  pomodoros?: number;
}

export interface HeatmapDay {
  date: string;
  study_seconds: number;
  pomodoros: number;
  lessons: number;
  level: number;
  courses?: DayCourse[];
}

export interface AvailableCourse {
  id: number;
  name: string;
}

export interface HeatmapResponse {
  current_streak: number;
  max_streak: number;
  total_seconds: number;
  total_pomodoros: number;
  total_lessons: number;
  today_seconds?: number;
  week_seconds?: number;
  week_active_days?: number;
  last_week_seconds?: number;
  delta_week_seconds?: number;
  available_courses?: AvailableCourse[];
  days: HeatmapDay[];
}

function resolveUrl(apiUrl?: string, path: string = ""): string {
  const base = (apiUrl || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export const statsApi = {
  async getHeatmap(
    apiUrl?: string,
    days: number = 180,
    courseId?: number | null
  ): Promise<HeatmapResponse> {
    const query = new URLSearchParams({ days: days.toString() });
    if (courseId !== undefined && courseId !== null) {
      query.set("course_id", courseId.toString());
    }
    const url = resolveUrl(apiUrl, `/api/stats/heatmap?${query.toString()}`);
    const res = await axios.get<HeatmapResponse>(url);
    return res.data;
  },

  async recordPomodoro(
    apiUrl?: string,
    studySeconds: number = 1500,
    courseId?: number,
    courseName?: string
  ): Promise<void> {
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const url = resolveUrl(apiUrl, "/api/stats/pomodoro");
    await axios.post(url, {
      study_seconds: studySeconds,
      course_id: courseId,
      course_name: courseName,
      date: localDate,
    });
  },

  async recordHeartbeat(
    apiUrl?: string,
    seconds: number = 0,
    courseId?: number,
    courseName?: string
  ): Promise<void> {
    if (seconds <= 0) return;
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const url = resolveUrl(apiUrl, "/api/stats/heartbeat");
    await axios.post(url, {
      seconds,
      course_id: courseId,
      course_name: courseName,
      date: localDate,
    });
  },
};


