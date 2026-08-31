import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LessonAttachments from "@/components/lesson/lesson-attachments";
import LessonNotes from "@/components/lesson/lesson-notes";
import CoursePercentage from "@/components/course-percentage";
import LastWatchedCard from "@/components/lesson/last-watched-card";
import LessonViewer from "@/components/lesson/lesson-viewer";
import ModuleList from "@/components/lesson/module-list";
import { useParams, useSearchParams } from "react-router-dom";
import useCoursePlayer from "@/hooks/useCoursePlayer";
import useLessonResources from "@/hooks/useLessonResources";
import { toast } from "sonner";
import { Lesson } from "@/models/models";

type Props = {};

export default function CoursePage({}: Props) {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const currentTab = tabParam === "overview" || !tabParam ? "videos" : tabParam;

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set("tab", value);
      return prev;
    }, { replace: true });
  };

  const {
    modules,
    isLoading,
    selectedLesson,
    selectCourseLesson,
    refreshCourseProgress,
  } = useCoursePlayer(courseId);

  const lessonResources = useLessonResources(selectedLesson?.id, courseId);

  // Flatten and sort lessons across all modules for linear navigation
  const allLessons = useMemo(() => {
    if (!modules) return [];
    const sortedModuleKeys = Object.keys(modules).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
    const list: Lesson[] = [];
    sortedModuleKeys.forEach((key) => {
      if (modules[key]) {
        const sortedLessons = [...modules[key]].sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" })
        );
        list.push(...sortedLessons);
      }
    });
    return list;
  }, [modules]);

  // Global navigation shortcuts (Shift+P, Shift+N)
  useEffect(() => {
    const handleNavigation = (direction: "prev" | "next") => {
      if (!selectedLesson || allLessons.length === 0) return;
      const currentIndex = allLessons.findIndex((l) => l.id === selectedLesson.id);
      if (currentIndex === -1) return;

      if (direction === "prev") {
        if (currentIndex > 0) {
          const prevLesson = allLessons[currentIndex - 1];
          selectCourseLesson(prevLesson);
          toast.info(`Aula anterior: ${prevLesson.title}`, { id: "lesson-navigation-toast", duration: 1500 });
        } else {
          toast.info("Você já está na primeira aula.", { id: "lesson-navigation-toast", duration: 1500 });
        }
      } else if (direction === "next") {
        if (currentIndex < allLessons.length - 1) {
          const nextLesson = allLessons[currentIndex + 1];
          selectCourseLesson(nextLesson);
          toast.info(`Próxima aula: ${nextLesson.title}`, { id: "lesson-navigation-toast", duration: 1500 });
        } else {
          toast.info("Você já está na última aula.", { id: "lesson-navigation-toast", duration: 1500 });
        }
      }
    };

    const handlePrevEvent = () => handleNavigation("prev");
    const handleNextEvent = () => handleNavigation("next");

    window.addEventListener("playerNavigatePrevious", handlePrevEvent);
    window.addEventListener("playerNavigateNext", handleNextEvent);

    return () => {
      window.removeEventListener("playerNavigatePrevious", handlePrevEvent);
      window.removeEventListener("playerNavigateNext", handleNextEvent);
    };
  }, [allLessons, selectedLesson, selectCourseLesson]);

  if (!courseId) {
    return "Sem id de curso";
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-2">
        <div className="w-full lg:col-span-7 space-y-4 max-h-max glass-panel rounded-md p-4">
          <div className="w-full aspect-video bg-white/10 rounded-md animate-pulse"></div>
          <div className="h-8 w-1/3 bg-white/10 rounded-md animate-pulse mt-4"></div>
          <div className="h-4 w-1/2 bg-white/10 rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="lg:col-span-3 py-4 glass-panel rounded-md p-4 space-y-4">
          <div className="h-6 w-1/2 bg-white/10 rounded-md animate-pulse"></div>
          <div className="h-4 w-full bg-white/10 rounded-md animate-pulse"></div>
          <div className="space-y-2 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-white/10 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLesson || modules && Object.keys(modules).length === 0) {
    return (
      <div className="glass-panel rounded-2xl border border-white/10 p-6 text-white/80">
        <h2 className="text-xl font-heading font-medium text-white">Nenhuma aula disponível</h2>
        <p className="mt-2 text-sm text-white/60">
          Verifique se o backend está rodando em `http://localhost:9823` e se o caminho do curso está correto.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 lg:h-[calc(100vh-136px)]">
      <div className="w-full lg:col-span-7 flex flex-col lg:h-full glass-panel rounded-2xl overflow-hidden min-w-0 bg-black/40">
        <LessonViewer 
          key={selectedLesson?.id}
          lesson={selectedLesson} 
          onLessonComplete={refreshCourseProgress}
        />
        <div className="p-4 border-t border-white/10 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2 truncate">
            {selectedLesson?.course_title} &gt; {selectedLesson?.module?.split('/').pop()?.trim()}
          </div>
          <h3 className="text-left font-heading font-medium text-2xl tracking-tight text-white truncate max-[1366px]:hidden" title={selectedLesson?.title}>
            {selectedLesson?.title}
          </h3>
        </div>
      </div>
      <div className="lg:col-span-3 flex flex-col lg:h-full h-[600px] glass-panel rounded-2xl overflow-hidden min-w-0">
        <div className="p-4 border-b border-white/10 space-y-2 shrink-0 bg-black/20">
          <h2 className="text-xl font-heading font-medium text-white line-clamp-1" title={selectedLesson?.course_title}>{selectedLesson?.course_title}</h2>
          <CoursePercentage courseId={Number(courseId)} fromGlobal />
        </div>
        <div className="shrink-0 bg-black/10">
          <LastWatchedCard courseId={courseId} />
        </div>
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
          <div className="w-full border-b border-white/10 shrink-0 px-6 py-2">
            <TabsList className="flex w-full bg-transparent p-0 justify-between items-center border-none gap-2">
              <TabsTrigger value="videos" className="flex-1 rounded-lg py-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border border-transparent data-[state=active]:bg-[#007bff] data-[state=active]:text-white data-[state=active]:border-[#007bff] data-[state=active]:shadow-md data-[state=active]:shadow-blue-900/30 text-white/60 bg-transparent hover:bg-white hover:text-[#007bff] hover:border-white">Vídeos</TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1 rounded-lg py-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border border-transparent data-[state=active]:bg-[#007bff] data-[state=active]:text-white data-[state=active]:border-[#007bff] data-[state=active]:shadow-md data-[state=active]:shadow-blue-900/30 text-white/60 bg-transparent hover:bg-white hover:text-[#007bff] hover:border-white">Anexos e Materiais</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 rounded-lg py-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border border-transparent data-[state=active]:bg-[#007bff] data-[state=active]:text-white data-[state=active]:border-[#007bff] data-[state=active]:shadow-md data-[state=active]:shadow-blue-900/30 text-white/60 bg-transparent hover:bg-white hover:text-[#007bff] hover:border-white">Anotações</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
            <TabsContent value="videos" className="m-0 mt-0 h-full outline-none p-2">
              <ModuleList
                modules={modules}
                courseId={courseId}
                selectedLessonId={selectedLesson?.id}
                onUpdate={refreshCourseProgress}
                onLessonSelect={selectCourseLesson}
              />
            </TabsContent>
            <TabsContent value="attachments" className="m-0 mt-0 h-full outline-none p-4">
              <LessonAttachments
                apiUrl={lessonResources.apiUrl}
                attachments={lessonResources.attachments}
                isLoading={lessonResources.isAttachmentsLoading}
              />
            </TabsContent>
            <TabsContent value="notes" className="m-0 mt-0 h-full outline-none p-4">
              <LessonNotes
                notes={lessonResources.notes}
                courseNotes={lessonResources.courseNotes}
                currentLessonId={selectedLesson?.id}
                courseTitle={selectedLesson?.course_title}
                lessonTitle={selectedLesson?.title}
                newNote={lessonResources.newNote}
                isLoading={lessonResources.isNotesLoading}
                isCourseNotesLoading={lessonResources.isCourseNotesLoading}
                onNewNoteChange={lessonResources.setNewNote}
                onSave={lessonResources.saveNote}
                onEdit={lessonResources.editNote}
                onDelete={lessonResources.deleteNote}
                onSeek={lessonResources.seekTo}
                onSelectLessonAndSeek={(targetLessonId, targetTime) => {
                  if (targetLessonId !== selectedLesson?.id) {
                    const targetLesson = allLessons.find((l) => l.id === targetLessonId);
                    if (targetLesson) {
                      selectCourseLesson(targetLesson);
                    }
                  }
                  setTimeout(() => {
                    lessonResources.seekTo(targetTime);
                  }, 300);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
