import { useEffect, useState } from "react";
import CoursesList from "@/components/courses/courses-list";
import { Course } from "@/models/models";
import AddCourse from "@/components/courses/add-course";
import { coursesApi } from "@/services/coursesApi";
import ActivityHeatmap from "@/components/stats/activity-heatmap";
import ResumeHeroCard from "@/components/courses/resume-hero-card";
import { useNavigate } from "react-router-dom";
import useApiUrl from "@/hooks/useApiUrl";
import { BookOpen, Clock, BarChart3 } from "lucide-react";

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
    <div className="w-full mb-4 space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* Navigation Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="bg-white/[0.04] border border-white/10 p-1 rounded-xl self-start backdrop-blur-md flex items-center gap-1 select-none">
          <button
            type="button"
            className="flex items-center gap-2 bg-white/15 text-white border-white/20 shadow-sm px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-default"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Cursos</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/foco")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border border-transparent cursor-pointer"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Foco</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/estatisticas")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border border-transparent cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Estatísticas</span>
          </button>
        </div>
      </div>

      {/* Spotlight: Resume Studies Hero */}
      {!isLoading && courses.length > 0 && (
        <ResumeHeroCard
          courses={courses}
          onPlay={(courseId) => navigate(`/receitas/${courseId}`)}
        />
      )}

      {/* Heatmap & Streaks Panel */}
      <ActivityHeatmap />

      {/* Courses List Section */}
      <div className="space-y-6 pt-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Meus Cursos
          </h1>
          <AddCourse onCreate={() => fetchCourses()} />
        </div>
        <section className="mt-8 flex flex-wrap gap-4 w-full justify-center">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[300px] h-[350px] glass-panel rounded-2xl animate-pulse"
              />
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
  );
}
