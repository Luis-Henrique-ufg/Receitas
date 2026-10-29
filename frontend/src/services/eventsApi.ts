import axios from "axios";
import { CreateEventInput, StudyEvent, UpdateEventInput } from "@/models/event";

function resolveUrl(apiUrl?: string, path: string = ""): string {
  const base = (apiUrl || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export interface ListEventsParams {
  month?: string;
  start_date?: string;
  end_date?: string;
  subject_id?: number;
  course_id?: number;
  upcoming?: number;
  include_done?: boolean;
}

export const eventsApi = {
  async getAll(apiUrl?: string, params?: ListEventsParams): Promise<StudyEvent[]> {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month);
    if (params?.start_date) query.set("start_date", params.start_date);
    if (params?.end_date) query.set("end_date", params.end_date);
    if (params?.subject_id !== undefined && params?.subject_id !== null) {
      query.set("subject_id", params.subject_id.toString());
    }
    if (params?.course_id !== undefined && params?.course_id !== null) {
      query.set("course_id", params.course_id.toString());
    }

    if (params?.upcoming !== undefined && params?.upcoming !== null) {
      query.set("upcoming", params.upcoming.toString());
    }
    if (params?.include_done !== undefined) {
      query.set("include_done", params.include_done ? "true" : "false");
    }

    const qs = query.toString();
    const url = resolveUrl(apiUrl, `/api/events${qs ? `?${qs}` : ""}`);
    const res = await axios.get<StudyEvent[]>(url);
    return res.data;
  },

  async getById(apiUrl?: string, id?: number): Promise<StudyEvent> {
    const url = resolveUrl(apiUrl, `/api/events/${id}`);
    const res = await axios.get<StudyEvent>(url);
    return res.data;
  },

  async create(apiUrl: string | undefined, input: CreateEventInput): Promise<StudyEvent> {
    const url = resolveUrl(apiUrl, "/api/events");
    const res = await axios.post<StudyEvent>(url, input);
    return res.data;
  },

  async update(
    apiUrl: string | undefined,
    id: number,
    input: UpdateEventInput
  ): Promise<StudyEvent> {
    const url = resolveUrl(apiUrl, `/api/events/${id}`);
    const res = await axios.put<StudyEvent>(url, input);
    return res.data;
  },

  async toggleDone(apiUrl: string | undefined, id: number): Promise<StudyEvent> {
    const url = resolveUrl(apiUrl, `/api/events/${id}/toggle-done`);
    const res = await axios.patch<StudyEvent>(url);
    return res.data;
  },

  async delete(apiUrl: string | undefined, id: number): Promise<void> {
    const url = resolveUrl(apiUrl, `/api/events/${id}`);
    await axios.delete(url);
  },

  getExportIcsUrl(
    apiUrl?: string,
    params?: { month?: string; subject_id?: number; course_id?: number }
  ): string {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month);
    if (params?.subject_id) query.set("subject_id", params.subject_id.toString());
    if (params?.course_id) query.set("course_id", params.course_id.toString());
    const qs = query.toString();
    return resolveUrl(apiUrl, `/api/events/export.ics${qs ? `?${qs}` : ""}`);
  },

  async downloadIcs(
    apiUrl?: string,
    params?: { month?: string; subject_id?: number; course_id?: number }
  ): Promise<void> {
    const url = this.getExportIcsUrl(apiUrl, params);
    const res = await axios.get(url, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `agenda_estudos_${params?.month || "todos"}.ics`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

};
