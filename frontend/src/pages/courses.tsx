import { useEffect, useState } from "react";
import CoursesList from "@/components/courses/courses-list";
import { Course } from "@/models/models";
import AddCourse from "@/components/courses/add-course";
import { coursesApi } from "@/services/coursesApi";
import ActivityHeatmap from "@/components/stats/activity-heatmap";
import ResumeHeroCard from "@/components/courses/resume-hero-card";
import { useNavigate } from "react-router-dom";
import useApiUrl from "@/hooks/useApiUrl";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [heroCourseId, setHeroCourseId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { apiUrl } = useApiUrl();

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await coursesApi.getAll(apiUrl);
      setCourses(data);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorderCourses = async (reorderedCourses: Course[]) => {
    setCourses(reorderedCourses);
    try {
      const orderPayload = reorderedCourses.map((c, index) => ({
        id: c.id,
        position: index,
      }));
      await coursesApi.reorder(apiUrl, orderPayload);
    } catch (error) {
      console.error("Erro ao salvar ordem dos cursos:", error);
      fetchCourses();
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [apiUrl]);

  // Read latest viewed lesson to highlight the hero course
  useEffect(() => {
    if (!courses || courses.length === 0) return;
    try {
      const historyStr = localStorage.getItem("lastViewedLessons");
      if (historyStr) {
        const history = JSON.parse(historyStr);
        let latestCourseId: number | null = null;
        let latestTime = 0;

        courses.forEach((c) => {
          const entry = history[c.id.toString()];
          if (entry && entry.last_watched) {
            const t = new Date(entry.last_watched).getTime();
            if (t > latestTime) {
              latestTime = t;
              latestCourseId = c.id;
            }
          }
        });

        if (latestCourseId) {
          setHeroCourseId(latestCourseId);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar histórico para hero card:", err);
    }
  }, [courses]);

  return (
    <div className="w-full space-y-10 sm:space-y-12 animate-in fade-in duration-300">
      {/* 1. Spotlight: Resume Studies Hero */}
      {!isLoading && courses.length > 0 && (
        <ResumeHeroCard
          courses={courses}
          onPlay={(courseId) => navigate(`/receitas/${courseId}`)}
        />
      )}

      {/* 2. Activity & Habit Rhythm Heatmap */}
      <ActivityHeatmap />

      {/* 3. Courses Catalog Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              Meus Cursos &amp; Receitas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse sua grade de aprendizado contínuo
            </p>
          </div>
          <AddCourse onCreate={() => fetchCourses()} />
        </div>

        <div className="w-full pt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-card border border-border rounded-3xl animate-pulse"
                />
              ))}
            </div>
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
        </div>
      </section>
    </div>
  );
}
