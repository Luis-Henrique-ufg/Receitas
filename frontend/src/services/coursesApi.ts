import axios from "axios";
import { Course } from "@/models/models";

export interface CreateCoursePayload {
  name: string;
  path: string;
  imageUrl?: string;
  imageFile?: File | null;
}

export interface UpdateCoursePayload {
  name: string;
  path: string;
  imageUrl?: string;
  imageFile?: File | null;
}

export interface CourseCompletionStats {
  completed_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  remaining_lessons?: number;
  remaining_seconds?: number;
  estimated_finish_month?: string | null;
  last_studied_date?: string | null;
  current_lesson_number?: number | null;
}


export const coursesApi = {
  async getAll(apiUrl: string): Promise<Course[]> {
    const res = await axios.get<Course[]>(`${apiUrl}/api/courses`);
    return res.data;
  },

  async getById(apiUrl: string, courseId: number): Promise<Course> {
    const res = await axios.get<Course>(`${apiUrl}/api/courses/${courseId}`);
    return res.data;
  },

  async reorder(apiUrl: string, items: { id: number; position: number }[]): Promise<void> {
    await axios.put(`${apiUrl}/api/courses/reorder`, items);
  },

  async create(apiUrl: string, payload: CreateCoursePayload): Promise<{ id: number; name: string }> {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("path", payload.path);
    if (payload.imageFile) {
      formData.append("imageFile", payload.imageFile);
    } else if (payload.imageUrl) {
      formData.append("imageURL", payload.imageUrl);
    }

    const res = await axios.post<{ id: number; name: string }>(`${apiUrl}/api/courses`, formData);
    return res.data;
  },

  async update(apiUrl: string, courseId: number, payload: UpdateCoursePayload): Promise<Course> {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("path", payload.path);
    if (payload.imageFile) {
      formData.append("imageFile", payload.imageFile);
    } else if (payload.imageUrl) {
      formData.append("imageURL", payload.imageUrl);
    }

    const res = await axios.put<Course>(`${apiUrl}/api/courses/${courseId}`, formData);
    return res.data;
  },

  async delete(apiUrl: string, courseId: number): Promise<void> {
    await axios.delete(`${apiUrl}/api/courses/${courseId}`);
  },

  async rescan(apiUrl: string, courseId: number): Promise<void> {
    await axios.post(`${apiUrl}/api/courses/${courseId}/rescan`);
  },

  async autoScanAll(apiUrl: string): Promise<void> {
    await axios.post(`${apiUrl}/api/courses/add-all`);
  },

  async getCompletionStats(apiUrl: string, courseId: number): Promise<CourseCompletionStats> {
    const res = await axios.get<CourseCompletionStats>(
      `${apiUrl}/api/courses/${courseId}/completed_percentage`
    );
    return res.data;
  },
};
