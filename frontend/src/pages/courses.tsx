import { useState, useEffect } from "react";
import { toast } from "sonner";
import CoursesList from "@/components/courses/courses-list";
import { Course } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import AddCourse from "@/components/courses/add-course";
import { useNavigate } from "react-router-dom";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const { apiUrl } = useApiUrl();

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/courses`);
      if (!response.ok) throw new Error("Falha ao buscar cursos");

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      toast.error("Erro ao carregar cursos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleReorderCourses(nextCourses: Course[]) {
    const reorderedData = nextCourses.map((course, index) => ({
      id: course.id,
      position: index,
    }));

    setCourses(nextCourses);

    try {
      const response = await fetch(`${apiUrl}/api/courses/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reorderedData),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar a nova ordem.");
      }

      toast.success("Ordem salva com sucesso!", { duration: 1500 });
    } catch {
      toast.error("Erro ao salvar a nova ordem dos cursos.");
      fetchCourses();
    }
  }

  return (
    <>
      <div className="w-full mb-4 space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Meus Cursos {/*({courses.length})*/}</h1>
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
