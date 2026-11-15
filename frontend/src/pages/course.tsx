import { useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Bookmark, Maximize2, Minimize2, ArrowLeft } from "lucide-react";
import LessonAttachments from "@/components/lesson/lesson-attachments";
import LessonNotes from "@/components/lesson/lesson-notes";
import CoursePercentage from "@/components/course-percentage";
import LastWatchedCard from "@/components/lesson/last-watched-card";
import LessonViewer from "@/components/lesson/lesson-viewer";
import ModuleList from "@/components/lesson/module-list";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
        <div className="w-full lg:col-span-7 space-y-4 max-h-max bg-card border border-border rounded-xl p-4">
          <div className="w-full aspect-video bg-muted rounded-md animate-pulse"></div>
          <div className="h-8 w-1/3 bg-muted rounded-md animate-pulse mt-4"></div>
          <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="lg:col-span-3 py-4 bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="h-6 w-1/2 bg-muted rounded-md animate-pulse"></div>
          <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
          <div className="space-y-2 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-muted rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLesson || modules && Object.keys(modules).length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-foreground">
        <h2 className="text-xl font-display font-medium text-foreground">Nenhuma aula disponível</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifique se o backend está rodando em `http://localhost:9823` e se o caminho do curso está correto.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-4 lg:h-[calc(100vh-96px)] lg:min-h-[540px]">
      {/* Left Column: Video Theater & Editorial Control Bar */}
      <div
        className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          isZenMode
            ? "fixed inset-0 z-[80] bg-background p-3 sm:p-5 justify-between select-none"
            : "w-full lg:col-span-8 xl:col-span-9 lg:h-full bg-card border border-border rounded-3xl tangerina-card overflow-hidden flex flex-col justify-between"
        )}
      >
        {/* Minimal Zen Top Bar */}
        {isZenMode && (
          <div
            key="zen-top-bar"
            className="w-full flex items-center justify-between px-5 py-2.5 bg-card/95 backdrop-blur-md rounded-2xl border border-border text-foreground z-20 transition-opacity opacity-95 hover:opacity-100 shrink-0 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="bg-primary/15 px-3 py-1 rounded-full text-[11px] font-display font-semibold text-primary border border-primary/30 inline-flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                Modo Zen
              </span>
              <span className="text-sm sm:text-base font-display font-semibold text-foreground truncate">
                {selectedLesson?.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => lessonResources.addQuickMarker()}
                className="text-xs gap-1.5 rounded-xl border-border bg-secondary/70 hover:bg-secondary text-foreground h-8"
                title="Marcar Timestamp"
              >
                <Bookmark className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Marcar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevLesson}
                disabled={!prevLesson}
                className="h-8 text-xs px-2.5 rounded-xl border-border bg-secondary/70 hover:bg-secondary"
                title="Aula Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={handleNextLesson}
                disabled={!nextLesson}
                className="h-8 text-xs px-2.5 rounded-xl bg-primary text-[#030607] hover:brightness-105"
                title="Próxima Aula"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleZenMode(false)}
                className="text-xs border-border bg-secondary/70 hover:bg-secondary text-foreground h-8 px-3 gap-1.5 rounded-xl"
                title="Sair do Modo Zen"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        )}

        {/* Center Video Stage — Seamless Full Utilization */}
        <div
          key="player-wrapper"
          className={cn(
            "w-full min-w-0 flex-1 flex items-center justify-center min-h-0 bg-[#0A0807] relative overflow-hidden",
            isZenMode && "my-2.5 rounded-3xl border border-border shadow-2xl"
          )}
        >
          <div className="w-full h-full flex items-center justify-center">
            <LessonViewer
              key={selectedLesson?.id}
              lesson={selectedLesson}
              courseId={courseId ? Number(courseId) : undefined}
              courseName={selectedLesson?.course_title}
              onLessonComplete={handleLessonComplete}
            />
          </div>
        </div>

        {/* Normal Bottom Editorial Bar */}
        {!isZenMode && (
          <div
            key="normal-bottom-bar"
            className="py-3 px-4 sm:px-6 border-t border-border shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 bg-card"
          >
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 text-[11.5px] font-medium text-muted-foreground mb-0.5 truncate">
                <button
                  type="button"
                  onClick={() => navigate("/receitas")}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Cursos</span>
                </button>
                <span className="opacity-40">&bull;</span>
                <span className="truncate">{selectedLesson?.module?.split("/").pop()?.trim()}</span>
              </div>
              <h3
                className="text-left font-display font-semibold text-base sm:text-[18px] lg:text-[20px] tracking-[-0.02em] leading-snug text-foreground truncate"
                title={selectedLesson?.title}
              >
                {selectedLesson?.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => lessonResources.addQuickMarker()}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground border border-border text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="hidden sm:inline">Marcar</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-semibold text-xs">Marcar ponto no vídeo</p>
                    <p className="text-[10px] opacity-75">Salva um marcador no segundo atual</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleZenMode(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary/70 hover:bg-secondary text-foreground border border-border text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="hidden sm:inline">Modo Zen</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-semibold text-xs">Modo Zen</p>
                    <p className="text-[10px] opacity-75">Visualização maximizada sem distrações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handlePrevLesson}
                      disabled={!prevLesson}
                      className="inline-flex items-center gap-1 h-9 px-3.5 rounded-xl bg-secondary/70 hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none text-foreground border border-border text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      <span>Anterior</span>
                    </button>
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
                    <button
                      type="button"
                      onClick={handleNextLesson}
                      disabled={!nextLesson}
                      className="inline-flex items-center gap-1 h-9 px-4 rounded-xl bg-primary hover:brightness-105 disabled:opacity-40 disabled:pointer-events-none text-[#030607] font-semibold text-[13px] shadow-[0_3px_12px_rgba(255,112,32,0.28)] transition-all cursor-pointer"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                    </button>
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

      {/* Right Column: Curriculum & Study Workspace Sidebar */}
      <div
        className={cn(
          "lg:col-span-4 xl:col-span-3 flex flex-col lg:h-full h-[600px] bg-card border border-border rounded-3xl tangerina-card overflow-hidden min-w-0",
          isZenMode && "hidden"
        )}
      >
        <div className="p-4 sm:p-5 border-b border-border space-y-2.5 shrink-0 bg-card">
          <h2
            className="text-[17px] sm:text-[18px] font-display font-semibold text-foreground tracking-[-0.02em] leading-snug line-clamp-1"
            title={selectedLesson?.course_title}
          >
            {selectedLesson?.course_title}
          </h2>
          <CoursePercentage courseId={Number(courseId)} fromGlobal />
        </div>

        <div className="shrink-0">
          <LastWatchedCard courseId={courseId} />
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
          <div className="w-full border-b border-border shrink-0 px-4 py-2.5 bg-card">
            <TabsList className="grid grid-cols-3 w-full bg-secondary/80 p-1 rounded-xl border border-border h-auto gap-1">
              <TabsTrigger
                value="videos"
                className="rounded-lg py-1.5 px-2 text-[12.5px] font-medium normal-case transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground bg-transparent hover:text-foreground cursor-pointer"
              >
                Vídeos
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="rounded-lg py-1.5 px-2 text-[12.5px] font-medium normal-case transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground bg-transparent hover:text-foreground cursor-pointer"
              >
                Materiais
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-lg py-1.5 px-2 text-[12.5px] font-medium normal-case transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground bg-transparent hover:text-foreground cursor-pointer"
              >
                Anotações
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative bg-card">
            <TabsContent value="videos" className="m-0 mt-0 h-full outline-none p-2.5">
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
