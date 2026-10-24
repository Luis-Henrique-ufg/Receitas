import axios from "axios";

export interface SearchCourseResult {
  id: number;
  name: string;
  url_cover?: string;
  file_cover?: string;
}

export interface SearchLessonResult {
  id: number;
  title: string;
  module?: string;
  course_id: number;
  course_name?: string;
  is_completed: boolean;
}

export interface SearchNoteResult {
  id: number;
  content: string;
  time: number;
  lesson_id: number;
  lesson_title?: string;
  course_id?: number;
  course_name?: string;
}

export interface SearchAttachmentResult {
  name: string;
  path: string;
  lesson_id: number;
  lesson_title?: string;
  course_id?: number;
  course_name?: string;
}

export interface SearchResults {
  courses: SearchCourseResult[];
  lessons: SearchLessonResult[];
  notes: SearchNoteResult[];
  attachments: SearchAttachmentResult[];
}

export const searchApi = {
  async search(apiUrl: string, query: string, limit: number = 20): Promise<SearchResults> {
    if (!query.trim()) {
      return { courses: [], lessons: [], notes: [], attachments: [] };
    }
    const res = await axios.get<SearchResults>(
      `${apiUrl}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return res.data;
  },
};
