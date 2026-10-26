import axios from "axios";

export interface DayCourse {
  id: number;
  name: string;
  seconds: number;
  pomodoros?: number;
}

export interface DaySubject {
  id: number | null;
  name: string;
  color: string;
  seconds: number;
  pomodoros: number;
}

export interface HeatmapDay {
  date: string;
  study_seconds: number;
  pomodoros: number;
  lessons: number;
  level: number;
  courses?: DayCourse[];
  subjects?: DaySubject[];
}

export interface AvailableCourse {
  id: number;
  name: string;
}

export interface AvailableSubject {
  id: number;
  name: string;
  color: string;
  is_archived?: boolean;
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
  available_subjects?: AvailableSubject[];
  days: HeatmapDay[];
}

export interface FocusBarBreakdownItem {
  subject_id: number | null;
  name: string;
  color: string;
  seconds: number;
  pomodoros: number;
}

export interface FocusBar {
  key: string;
  label: string;
  sublabel: string;
  start_date: string;
  end_date: string;
  total_seconds: number;
  total_pomodoros: number;
  breakdown: FocusBarBreakdownItem[];
}

export interface FocusBarsSubjectMeta {
  id: number | null;
  name: string;
  color: string;
  is_archived?: boolean;
  study_seconds: number;
  pomodoros: number;
}

export interface FocusBarsResponse {
  period: "day" | "week" | "month" | "year";
  offset: number;
  range_label: string;
  start_date: string;
  end_date: string;
  total_study_seconds: number;
  total_pomodoros: number;
  subjects: FocusBarsSubjectMeta[];
  bars: FocusBar[];
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
    courseId?: number | null,
    subjectId?: number | null
  ): Promise<HeatmapResponse> {
    const query = new URLSearchParams({ days: days.toString() });
    if (courseId !== undefined && courseId !== null) {
      query.set("course_id", courseId.toString());
    }
    if (subjectId !== undefined && subjectId !== null) {
      query.set("subject_id", subjectId.toString());
    }
    const url = resolveUrl(apiUrl, `/api/stats/heatmap?${query.toString()}`);
    const res = await axios.get<HeatmapResponse>(url);
    return res.data;
  },

  async getFocusBars(
    apiUrl?: string,
    period: "day" | "week" | "month" | "year" = "day",
    offset: number = 0,
    limit?: number
  ): Promise<FocusBarsResponse> {
    const query = new URLSearchParams({ period, offset: offset.toString() });
    if (limit) {
      query.set("limit", limit.toString());
    }
    const url = resolveUrl(apiUrl, `/api/stats/focus-bars?${query.toString()}`);
    const res = await axios.get<FocusBarsResponse>(url);
    return res.data;
  },

  async recordPomodoro(
    apiUrl?: string,
    studySeconds: number = 1500,
    courseId?: number,
    courseName?: string,
    subjectId?: number | null,
    subjectName?: string | null,
    pomodoros: number = 1
  ): Promise<void> {
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const url = resolveUrl(apiUrl, "/api/stats/pomodoro");
    await axios.post(url, {
      study_seconds: studySeconds,
      course_id: courseId,
      course_name: courseName,
      subject_id: subjectId,
      subject_name: subjectName,
      pomodoros: Math.max(1, pomodoros),
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
