import { useEffect, useMemo, useState } from "react";
import CoursesList from "@/components/courses/courses-list";
import { Course } from "@/models/models";
import AddCourse from "@/components/courses/add-course";
import { coursesApi } from "@/services/coursesApi";
import ActivityHeatmap from "@/components/stats/activity-heatmap";
import ResumeHeroCard from "@/components/courses/resume-hero-card";
import { getCourseCategoryTag } from "@/utils/courseCategory";
import { useNavigate } from "react-router-dom";
import useApiUrl from "@/hooks/useApiUrl";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
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

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      const tag = getCourseCategoryTag(c);
      if (tag?.label) set.add(tag.label);
    });
    return ["Todos", ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === "Todos") return courses;
    return courses.filter(
      (c) => getCourseCategoryTag(c).label === selectedCategory
    );
  }, [courses, selectedCategory]);

  return (
    <div className="w-full space-y-8 sm:space-y-10 animate-in fade-in duration-300">
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-display font-medium text-foreground tracking-[-0.02em] leading-[1.15]">
              Meus Cursos &amp; Receitas
            </h2>
            <p className="text-[14px] text-muted-foreground mt-1">
              Acesse sua grade de aprendizado contínuo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {availableCategories.length > 2 && (
              <div className="flex items-center gap-1.5 flex-wrap mr-1">
                {availableCategories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all cursor-pointer ${
                        isActive
                          ? "bg-foreground text-background border-foreground font-semibold shadow-sm"
                          : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
            <AddCourse onCreate={() => fetchCourses()} />
          </div>
        </div>

        <div className="w-full pt-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-card border border-border rounded-3xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <CoursesList
              courses={filteredCourses}
              heroCourseId={heroCourseId}
              isEditable={selectedCategory === "Todos"}
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
