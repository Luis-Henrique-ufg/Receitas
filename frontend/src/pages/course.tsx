import { useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Bookmark, Sparkles, Minimize2 } from "lucide-react";
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
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { cn } from "@/lib/utils";
import { setLastViewedLesson } from "@/utils/utils";


export default function CoursePage() {
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
  const navigationAction = usePlaybackStore((state) => state.navigationAction);
  const clearNavigationAction = usePlaybackStore((state) => state.clearNavigationAction);
  const isZenMode = usePlaybackStore((state) => state.isZenMode);
  const toggleZenMode = usePlaybackStore((state) => state.toggleZenMode);
  const setCurrentCoursePomodoro = usePomodoroStore((state) => state.setCurrentCourse);

  useEffect(() => {
    if (courseId && selectedLesson?.course_title) {
      setCurrentCoursePomodoro(Number(courseId), selectedLesson.course_title);
    }
    return () => {
      setCurrentCoursePomodoro(null, null);
    };
  }, [courseId, selectedLesson?.course_title, setCurrentCoursePomodoro]);


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

  const currentIndex = useMemo(() => {
    if (!selectedLesson || allLessons.length === 0) return -1;
    return allLessons.findIndex((l) => l.id === selectedLesson.id);
  }, [allLessons, selectedLesson]);

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handlePrevLesson = useCallback(() => {
    if (prevLesson) {
      selectCourseLesson(prevLesson);
      toast.info(`Aula anterior: ${prevLesson.title}`, { id: "lesson-navigation-toast", duration: 1500 });
    } else {
      toast.info("Você já está na primeira aula.", { id: "lesson-navigation-toast", duration: 1500 });
    }
  }, [prevLesson, selectCourseLesson]);

  const handleNextLesson = useCallback(() => {
    if (nextLesson) {
      selectCourseLesson(nextLesson);
      toast.info(`Próxima aula: ${nextLesson.title}`, { id: "lesson-navigation-toast", duration: 1500 });
    } else {
      toast.info("Você já está na última aula.", { id: "lesson-navigation-toast", duration: 1500 });
    }
  }, [nextLesson, selectCourseLesson]);

  const handleLessonComplete = useCallback(() => {
    refreshCourseProgress();
    if (nextLesson && courseId) {
      setLastViewedLesson(courseId, nextLesson);
    }
  }, [refreshCourseProgress, nextLesson, courseId]);


  // Handle store-based and event-based navigation
  useEffect(() => {
    if (navigationAction === "previous") {
      handlePrevLesson();
      clearNavigationAction();
    } else if (navigationAction === "next") {
      handleNextLesson();
      clearNavigationAction();
    }
  }, [navigationAction, handlePrevLesson, handleNextLesson, clearNavigationAction]);

  useEffect(() => {
    const handlePrevEvent = () => handlePrevLesson();
    const handleNextEvent = () => handleNextLesson();

    window.addEventListener("playerNavigatePrevious", handlePrevEvent);
    window.addEventListener("playerNavigateNext", handleNextEvent);

    return () => {
      window.removeEventListener("playerNavigatePrevious", handlePrevEvent);
      window.removeEventListener("playerNavigateNext", handleNextEvent);
    };
  }, [handlePrevLesson, handleNextLesson]);

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
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-3 xl:gap-4 lg:h-[calc(100vh-100px)] lg:min-h-[500px]">
      <div
        className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          isZenMode
            ? "fixed inset-0 z-[80] bg-[#050a14] p-3 sm:p-6 justify-between select-none"
            : "w-full lg:col-span-7 lg:h-full glass-panel rounded-2xl overflow-hidden bg-black/40 flex flex-col justify-between"
        )}
      >
        {/* Minimal Zen Top Bar */}
        {isZenMode && (
          <div
            key="zen-top-bar"
            className="w-full flex items-center justify-between px-5 py-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white z-20 transition-opacity opacity-75 hover:opacity-100 shrink-0"
          >
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Modo Zen
              </span>
              <span className="text-sm font-heading font-medium truncate max-w-[200px] sm:max-w-md">
                {selectedLesson?.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => lessonResources.addQuickMarker()}
                className="text-xs gap-1.5 text-zinc-300 hover:text-white h-8"
                title="Marcar Timestamp (B)"
              >
                <Bookmark className="w-3.5 h-3.5 fill-[#007bff] text-[#007bff]" />
                <span className="hidden sm:inline">Marcar (B)</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevLesson}
                disabled={!prevLesson}
                className="h-8 text-xs px-2.5 bg-white/5 border-white/10 text-white"
                title="Aula Anterior (Shift+P)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextLesson}
                disabled={!nextLesson}
                className="h-8 text-xs px-2.5 bg-white/5 border-white/10 text-white"
                title="Próxima Aula (Shift+N)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleZenMode(false)}
                className="text-xs text-zinc-300 hover:text-white h-8 px-3 gap-1.5 bg-white/5 hover:bg-white/10"
                title="Sair do Modo Zen (ESC ou Z)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair (Z)</span>
              </Button>
            </div>
          </div>
        )}

        {/* Center player container */}
        <div
          key="player-wrapper"
          className={cn(
            "w-full min-w-0 flex-1 flex items-center justify-center min-h-0",
            isZenMode ? "my-2" : "p-1.5 sm:p-2"
          )}
        >
          <div
            className={cn(
              "w-full transition-all duration-300",
              isZenMode
                ? "max-w-[min(1152px,calc((100vh-130px)*16/9))] rounded-2xl overflow-hidden glass-panel border border-white/10 p-1.5 sm:p-2 shadow-2xl shadow-black/80 flex items-center justify-center"
                : "max-h-[calc(100vh-185px)] aspect-video max-w-full flex items-center justify-center"
            )}
          >
            <LessonViewer
              key={selectedLesson?.id}
              lesson={selectedLesson}
              courseId={courseId ? Number(courseId) : undefined}
              courseName={selectedLesson?.course_title}
              onLessonComplete={handleLessonComplete}
            />

          </div>
        </div>

        {/* Normal Bottom Bar */}
        {!isZenMode && (
          <div
            key="normal-bottom-bar"
            className="py-2.5 px-3 sm:px-4 border-t border-white/10 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0 bg-black/20"
          >
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-white/50 mb-0.5 truncate">
                {selectedLesson?.course_title} &gt; {selectedLesson?.module?.split('/').pop()?.trim()}
              </div>
              <h3 className="text-left font-heading font-medium text-sm sm:text-base lg:text-lg tracking-tight text-white truncate" title={selectedLesson?.title}>
                {selectedLesson?.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => lessonResources.addQuickMarker()}
                      className="gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium bg-white/5 hover:bg-white/15 border-white/10 text-white/80 hover:text-white transition-all duration-300"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-[#007bff] text-[#007bff]" />
                      <span className="hidden sm:inline">Marcar (B)</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-semibold text-xs">Marcar ponto no vídeo (B)</p>
                    <p className="text-[10px] opacity-75">Salva um marcador rápido no segundo atual</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleZenMode(true)}
                      className="gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium bg-white/5 hover:bg-white/15 border-white/10 text-cyan-300 hover:text-cyan-200 transition-all duration-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Modo Zen (Z)</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-semibold text-xs">Ativar Modo Zen (Z)</p>
                    <p className="text-[10px] opacity-75">Visualização maximizada sem distrações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevLesson}
                      disabled={!prevLesson}
                      className="gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 text-xs font-medium bg-white/5 hover:bg-white/15 border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/80" />
                      <span>Anterior</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {prevLesson ? (
                      <div>
                        <p className="font-semibold text-xs">Aula anterior (Shift+P)</p>
                        <p className="text-[10px] opacity-75">{prevLesson.title}</p>
                      </div>
                    ) : (
                      <p className="text-xs">Primeira aula do curso</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleNextLesson}
                      disabled={!nextLesson}
                      className="gap-1.5 h-8 sm:h-9 px-3.5 sm:px-4 text-xs font-medium bg-[#007bff] hover:bg-white hover:text-[#007bff] text-white border border-[#007bff]/50 shadow-md shadow-blue-900/30 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {nextLesson ? (
                      <div>
                        <p className="font-semibold text-xs">Próxima aula (Shift+N)</p>
                        <p className="text-[10px] opacity-75">{nextLesson.title}</p>
                      </div>
                    ) : (
                      <p className="text-xs">Última aula do curso</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
      <div className={cn("lg:col-span-3 flex flex-col lg:h-full h-[550px] glass-panel rounded-2xl overflow-hidden min-w-0", isZenMode && "hidden")}>
        <div className="p-3 sm:p-3.5 border-b border-white/10 space-y-1.5 shrink-0 bg-black/20">
          <h2 className="text-base sm:text-lg font-heading font-medium text-white line-clamp-1" title={selectedLesson?.course_title}>{selectedLesson?.course_title}</h2>
          <CoursePercentage courseId={Number(courseId)} fromGlobal />
        </div>
        <div className="shrink-0 bg-black/10">
          <LastWatchedCard courseId={courseId} />
        </div>
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
          <div className="w-full border-b border-white/10 shrink-0 px-3 py-1.5">
            <TabsList className="flex w-full bg-transparent p-0 justify-between items-center border-none gap-1">
              <TabsTrigger value="videos" className="flex-1 rounded-lg py-1 px-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border border-transparent data-[state=active]:bg-[#007bff] data-[state=active]:text-white data-[state=active]:border-[#007bff] data-[state=active]:shadow-md data-[state=active]:shadow-blue-900/30 text-white/60 bg-transparent hover:bg-white hover:text-[#007bff] hover:border-white">Vídeos</TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1 rounded-lg py-1 px-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border border-transparent data-[state=active]:bg-[#007bff] data-[state=active]:text-white data-[state=active]:border-[#007bff] data-[state=active]:shadow-md data-[state=active]:shadow-blue-900/30 text-white/60 bg-transparent hover:bg-white hover:text-[#007bff] hover:border-white">Materiais</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 rounded-lg py-1 px-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border border-transparent data-[state=active]:bg-[#007bff] data-[state=active]:text-white data-[state=active]:border-[#007bff] data-[state=active]:shadow-md data-[state=active]:shadow-blue-900/30 text-white/60 bg-transparent hover:bg-white hover:text-[#007bff] hover:border-white">Anotações</TabsTrigger>
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
