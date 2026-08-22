import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";

interface CourseCompletionState {
  completionPercentage: number | null;
  totalLessons: number | null;
  completedLessons: number | null;
  isLoading: boolean;
  fetchCompletion: (apiUrl: string, courseId: number) => Promise<void>;
}

const useCourseCompletion = create<CourseCompletionState>((set) => ({
  completionPercentage: null,
  totalLessons: null,
  completedLessons: null,
  isLoading: true,
  fetchCompletion: async (apiUrl, courseId) => {
    try {
      const response = await axios.get<{
        completion_percentage: number;
        total_lessons?: number;
        completed_lessons?: number;
      }>(
        `${apiUrl}/api/courses/${courseId}/completed_percentage`
      );
      const data = response.data;
      set({
        completionPercentage: data.completion_percentage,
        totalLessons: data.total_lessons ?? null,
        completedLessons: data.completed_lessons ?? null,
        isLoading: false,
      });
    } catch (error) {
      toast.error("Erro ao buscar a porcentagem de conclusão do curso:");
      set({ isLoading: false });
    }
  },
}));

export default useCourseCompletion;
