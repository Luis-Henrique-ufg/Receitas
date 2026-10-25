import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import CoursesList from "@/components/courses/courses-list";
import { Course } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import AddCourse from "@/components/courses/add-course";
import ActivityHeatmap from "@/components/stats/activity-heatmap";
import ResumeHeroCard from "@/components/courses/resume-hero-card";
import { useNavigate } from "react-router-dom";
import { coursesApi } from "@/services/coursesApi";
import { getLastViewedLesson } from "@/utils/utils";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const { apiUrl } = useApiUrl();

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await coursesApi.getAll(apiUrl);
      setCourses(data);
    } catch {
      toast.error("Erro ao carregar cursos.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function handleReorderCourses(nextCourses: Course[]) {
    const reorderedData = nextCourses.map((course, index) => ({
      id: course.id,
      position: index,
    }));

    setCourses(nextCourses);

    try {
      await coursesApi.reorder(apiUrl, reorderedData);
      toast.success("Ordem salva com sucesso!", { duration: 1500 });
    } catch {
      toast.error("Erro ao salvar a nova ordem dos cursos.");
      fetchCourses();
    }
  }

  const heroCourseId = useMemo(() => {
    if (!courses || courses.length === 0) return null;
    for (const c of courses) {
      if (getLastViewedLesson(c.id.toString())) return c.id;
    }
    return courses[0].id;
  }, [courses]);

  return (
    <>
      <div className="w-full mb-4 space-y-6 max-w-7xl mx-auto pb-20">
        {/* Spotlight: Resume Studies Hero */}
        {!isLoading && courses.length > 0 && (
          <ResumeHeroCard
            courses={courses}
            onPlay={(courseId) => navigate(`/receitas/${courseId}`)}
          />
        )}

        {/* Heatmap & Streaks Panel (Current Week on Left) */}
        <ActivityHeatmap />

        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
              Meus Cursos
            </h1>
            <AddCourse onCreate={() => fetchCourses()} />
          </div>
          <section className="mt-10 flex flex-wrap gap-4 w-full justify-center">
            {isLoading ? (
              // Skeleton Loaders
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[300px] h-[350px] glass-panel rounded-2xl animate-pulse"></div>
              ))
            ) : (
              <CoursesList
                courses={courses}
                heroCourseId={heroCourseId}
                isEditable
                onRefresh={fetchCourses}
                onReorder={handleReorderCourses}
                onPlay={(courseId) => navigate(`/receitas/${courseId}`)}
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
