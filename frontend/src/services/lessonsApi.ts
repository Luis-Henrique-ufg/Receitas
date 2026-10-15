import axios from "axios";
import { Modules } from "@/models/models";

export interface UpdateLessonProgressPayload {
  lessonId: number;
  progressStatus?: string;
  isCompleted?: boolean;
  time_elapsed?: number;
}

export interface LessonNote {
  id: number;
  time: number;
  content: string;
}

export interface CourseNote {
  id: number;
  lesson_id: number;
  lesson_title: string;
  module: string;
  time: number;
  content: string;
}

export interface LessonAttachment {
  name: string;
  path: string;
}

export const lessonsApi = {
  async getLessons(apiUrl: string, courseId: number): Promise<Modules> {
    const res = await axios.get<Modules>(`${apiUrl}/api/courses/${courseId}/lessons`);
    return res.data;
  },

  async getElapsedTime(apiUrl: string, lessonId: number): Promise<number | undefined> {
    const res = await axios.get<{ elapsedTime: string | number }>(`${apiUrl}/api/lessons/${lessonId}`);
    return res.data.elapsedTime !== undefined && res.data.elapsedTime !== null
      ? Number(res.data.elapsedTime)
      : undefined;
  },

  async updateProgress(apiUrl: string, data: UpdateLessonProgressPayload): Promise<void> {
    await axios.post(`${apiUrl}/api/update-lesson-progress`, data);
  },

  async getAttachments(apiUrl: string, lessonId: number): Promise<LessonAttachment[]> {
    const res = await axios.get<LessonAttachment[]>(`${apiUrl}/api/lessons/${lessonId}/attachments`);
    return res.data;
  },

  async getLessonNotes(apiUrl: string, lessonId: number): Promise<LessonNote[]> {
    const res = await axios.get<LessonNote[]>(`${apiUrl}/api/lessons/${lessonId}/notes`);
    return res.data;
  },

  async getCourseNotes(apiUrl: string, courseId: number | string): Promise<CourseNote[]> {
    const res = await axios.get<CourseNote[]>(`${apiUrl}/api/courses/${courseId}/notes`);
    return res.data;
  },

  async createNote(
    apiUrl: string,
    lessonId: number,
    data: { time: number; content: string }
  ): Promise<LessonNote> {
    const res = await axios.post<LessonNote>(`${apiUrl}/api/lessons/${lessonId}/notes`, data);
    return res.data;
  },

  async updateNote(apiUrl: string, noteId: number, data: { content: string }): Promise<LessonNote> {
    const res = await axios.put<LessonNote>(`${apiUrl}/api/notes/${noteId}`, data);
    return res.data;
  },

  async deleteNote(apiUrl: string, noteId: number): Promise<void> {
    await axios.delete(`${apiUrl}/api/notes/${noteId}`);
  },

  getExportNotesUrl(apiUrl: string, courseId: number | string, format: string = "md"): string {
    return `${apiUrl}/api/courses/${courseId}/notes/export?format=${format}`;
  },
};
