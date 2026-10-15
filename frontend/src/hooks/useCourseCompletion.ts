import { create } from "zustand";
import { toast } from "sonner";
import { coursesApi } from "@/services/coursesApi";

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
      const data = await coursesApi.getCompletionStats(apiUrl, courseId);
      set({
        completionPercentage: data.completed_percentage,
        totalLessons: data.total_lessons ?? null,
        completedLessons: data.completed_lessons ?? null,
        isLoading: false,
      });
    } catch {
      toast.error("Erro ao buscar a porcentagem de conclusão do curso:");
      set({ isLoading: false });
    }
  },
}));

export default useCourseCompletion;
