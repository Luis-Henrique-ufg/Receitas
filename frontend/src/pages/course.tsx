import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LessonAttachments from "@/components/lesson/lesson-attachments";
import LessonNotes from "@/components/lesson/lesson-notes";
import CoursePercentage from "@/components/course-percentage";
import LastWatchedCard from "@/components/lesson/last-watched-card";
import LessonViewer from "@/components/lesson/lesson-viewer";
import ModuleList from "@/components/lesson/module-list";
import { useParams } from "react-router-dom";
import useCoursePlayer from "@/hooks/useCoursePlayer";
import useLessonResources from "@/hooks/useLessonResources";

type Props = {};

export default function CoursePage({}: Props) {
  const { courseId } = useParams<{ courseId: string }>();
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
      <div className="w-full lg:col-span-7 flex flex-col lg:h-full glass-panel rounded-2xl overflow-hidden">
        <div className="shrink-0 bg-black/40">
          <LessonViewer 
            lesson={selectedLesson} 
            onLessonComplete={refreshCourseProgress}
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <h3 className="text-left font-heading font-medium text-2xl tracking-tight text-white">{selectedLesson?.title}</h3>
          
          <Tabs defaultValue="overview" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-lg p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#007bff] data-[state=active]:text-white rounded-md transition-colors duration-300">Visão Geral</TabsTrigger>
              <TabsTrigger value="attachments" className="data-[state=active]:bg-[#007bff] data-[state=active]:text-white rounded-md transition-colors duration-300">Anexos e Materiais</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-[#007bff] data-[state=active]:text-white rounded-md transition-colors duration-300">Anotações</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4 text-white/70">
              <p>Bem-vindo(a) a esta aula! Assista ao conteúdo acima e, ao finalizar, não se esqueça de marcar como concluído.</p>
            </TabsContent>
            <TabsContent value="attachments" className="mt-4">
              <LessonAttachments
                apiUrl={lessonResources.apiUrl}
                attachments={lessonResources.attachments}
                isLoading={lessonResources.isAttachmentsLoading}
              />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
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
          </Tabs>
        </div>
      </div>
      <div className="lg:col-span-3 flex flex-col lg:h-full h-[600px] glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 space-y-2 shrink-0 bg-black/20">
          <h2 className="text-xl font-heading font-medium text-white">{selectedLesson?.course_title}</h2>
          <CoursePercentage courseId={Number(courseId)} fromGlobal />
        </div>
        <div className="shrink-0 bg-black/10">
          <LastWatchedCard courseId={courseId} />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <ModuleList
            modules={modules}
            courseId={courseId}
            selectedLessonId={selectedLesson?.id}
            onUpdate={refreshCourseProgress}
            onLessonSelect={selectCourseLesson}
          />
        </div>
      </div>
    </div>
  );
}
