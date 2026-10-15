import { useState, useEffect } from "react";
import useApiUrl from "@/hooks/useApiUrl";
import Loading from "./loading";
import useCourseCompletion from "@/hooks/useCourseCompletion";
import ProgressCard from "./progress-card";
import { coursesApi } from "@/services/coursesApi";

type Props = {
  courseId: number;
  fromGlobal?: boolean;
  showTitle?: boolean;
};

function CoursePercentage({ courseId, fromGlobal = false, showTitle = true }: Props) {
  const [courseStats, setCourseStats] = useState<{
    percentage: number | null;
    total: number | null;
    completed: number | null;
  }>({ percentage: null, total: null, completed: null });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { apiUrl } = useApiUrl();

  const {
    isLoading: globalLoading,
    completionPercentage: globalPercentage,
    totalLessons: globalTotal,
    completedLessons: globalCompleted,
    fetchCompletion,
  } = useCourseCompletion();

  const percentage = fromGlobal ? globalPercentage : courseStats.percentage;
  const total = fromGlobal ? globalTotal : courseStats.total;
  const completed = fromGlobal ? globalCompleted : courseStats.completed;

  useEffect(() => {
    if (fromGlobal) {
      fetchCompletion(apiUrl, courseId);
      return;
    }

    const fetchCompletionPercentage = async () => {
      try {
        const data = await coursesApi.getCompletionStats(apiUrl, courseId);
        setCourseStats({
          percentage: data.completed_percentage,
          total: data.total_lessons ?? null,
          completed: data.completed_lessons ?? null,
        });
      } catch (error) {
        console.error(
          "Erro ao buscar a porcentagem de conclusão do curso:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionPercentage();
  }, [courseId, fromGlobal, apiUrl, fetchCompletion]);

  return (
    <div className="w-full">
      {(fromGlobal ? globalLoading : isLoading) ? (
        <Loading />
      ) : (
        <div>
          {percentage !== null ? (
            <ProgressCard
              value={percentage}
              totalLessons={total}
              completedLessons={completed}
              showTitle={showTitle}
            />
          ) : (
            <div className="text-xs text-red-500">
              Erro ao carregar a porcentagem de conclusão do curso
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CoursePercentage;
