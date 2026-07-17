import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LessonAttachments from "@/components/lesson/lesson-attachments";
import LessonNotes from "@/components/lesson/lesson-notes";
import CoursePercentage from "@/components/course-percentage";
import LastWatchedCard from "@/components/lesson/last-watched-card";
import LessonViewer from "@/components/lesson/lesson-viewer";
import ModuleList from "@/components/lesson/module-list";
import LessonOverview from "@/components/lesson/lesson-overview";
import { useParams, useSearchParams } from "react-router-dom";
import useCoursePlayer from "@/hooks/useCoursePlayer";
import useLessonResources from "@/hooks/useLessonResources";
import { ChevronRight, Home } from "lucide-react";

type Props = {};

export default function CoursePage({}: Props) {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "videos";

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

  const lessonResources = useLessonResources(selectedLesson?.id);

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
          lesson={selectedLesson} 
          onLessonComplete={refreshCourseProgress}
        />
        <div className="p-6 border-t border-white/10 flex-1 flex flex-col justify-center bg-black/20">
          <nav className="flex items-center space-x-1 text-sm font-medium text-white/50 mb-2 truncate">
            <Home className="w-4 h-4 shrink-0" />
            <ChevronRight className="w-4 h-4 shrink-0 mx-1 opacity-50" />
            <span className="truncate hover:text-white transition-colors cursor-default" title={selectedLesson?.course_title}>
              {selectedLesson?.course_title}
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 mx-1 opacity-50" />
            <span className="truncate hover:text-white transition-colors cursor-default" title={selectedLesson?.module}>
              {selectedLesson?.module}
            </span>
          </nav>
          <h3 className="text-left font-heading font-semibold text-3xl tracking-tight text-white truncate" title={selectedLesson?.title}>
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
          <div className="w-full border-b border-white/10 shrink-0">
            <TabsList className="flex w-full bg-transparent p-0 overflow-x-auto custom-scrollbar overflow-y-hidden justify-start border-none">
              <TabsTrigger value="videos" className="flex-1 shrink-0 min-w-max rounded-none border-b-2 border-transparent data-[state=active]:border-[#007bff] data-[state=active]:text-[#007bff] data-[state=active]:shadow-none text-white/60 bg-transparent px-4 py-3 transition-colors">Vídeos</TabsTrigger>
              <TabsTrigger value="overview" className="flex-1 shrink-0 min-w-max rounded-none border-b-2 border-transparent data-[state=active]:border-[#007bff] data-[state=active]:text-[#007bff] data-[state=active]:shadow-none text-white/60 bg-transparent px-4 py-3 transition-colors">Visão Geral</TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1 shrink-0 min-w-max rounded-none border-b-2 border-transparent data-[state=active]:border-[#007bff] data-[state=active]:text-[#007bff] data-[state=active]:shadow-none text-white/60 bg-transparent px-4 py-3 transition-colors">Anexos e Materiais</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 shrink-0 min-w-max rounded-none border-b-2 border-transparent data-[state=active]:border-[#007bff] data-[state=active]:text-[#007bff] data-[state=active]:shadow-none text-white/60 bg-transparent px-4 py-3 transition-colors">Anotações</TabsTrigger>
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
            <TabsContent value="overview" className="m-0 mt-0 h-full outline-none p-4">
              <LessonOverview lesson={selectedLesson} />
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
                newNote={lessonResources.newNote}
                isLoading={lessonResources.isNotesLoading}
                onNewNoteChange={lessonResources.setNewNote}
                onSave={lessonResources.saveNote}
                onDelete={lessonResources.deleteNote}
                onSeek={lessonResources.seekTo}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
