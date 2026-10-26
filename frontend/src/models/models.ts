export type Course = {
  id: number;
  fileCover?: string;
  isCoverUrl: boolean;
  name: string;
  path: string;
  urlCover?: string;
  position?: number;
};

export type Lesson = {
  id: number;
  module: string;
  progressStatus: string;
  hierarchy_path: string;
  course_title: string;
  isCompleted: boolean;
  title: string;
  video_url: string;
  time_elapsed?: number;
  duration: string;
  pdf_url: string;
  description?: string;
};

export type Module = {
  name: string;
  lessons: Lesson[];
};

export type Modules = Record<string, Lesson[]>;

export type Hierarchy = {
  [key: string]: Hierarchy | Lesson[];
};

export interface Subject {
  id: number;
  name: string;
  color: string;
  code?: string | null;
  semester?: string | null;
  is_archived: boolean;
  created_at?: string;
}
