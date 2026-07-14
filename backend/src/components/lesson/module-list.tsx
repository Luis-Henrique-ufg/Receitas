import { Lesson, Modules } from "@/models/models";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import LessonListItem from "./lesson-list-item";
import useSelectedLesson from "@/hooks/useSelectedLesson";

import {
  calculateCompletionPercentage,
} from "@/utils/utils";

import { toast } from "sonner";
import ProgressCard from "../progress-card";
import { Button } from "../ui/button";
import { CheckCheck } from "lucide-react";
import useApiUrl from "@/hooks/useApiUrl";
import { completeLesson } from "@/services/videoPlayer";
import { useState } from "react";

type Props = {
  modules: Modules;
  onUpdate: () => void;
  courseId: string;
  selectedLessonId?: number;
  onLessonSelect: (lesson: Lesson) => void;
};

export default function ModuleList({
  modules,
  onUpdate,
  courseId,
  selectedLessonId,
  onLessonSelect,
}: Props) {
  const { apiUrl } = useApiUrl();
  const [completingModule, setCompletingModule] = useState<string | null>(null);

  function handleCompleteLesson() {
    try {
      onUpdate();
    } catch {
      toast.error("erro ao atualizar progresso");
    }
  }

  async function handleCompleteModule(e: React.MouseEvent, title: string, lessons: any[]) {
    e.stopPropagation();
    setCompletingModule(title);
    try {
      const incompleteLessons = lessons.filter((l) => !l.completed);
      await Promise.all(incompleteLessons.map((l) => completeLesson(apiUrl, l.id, true)));
      if (incompleteLessons.length > 0) {
        toast.success("Módulo concluído");
        onUpdate();
      } else {
        toast.info("Módulo já estava concluído");
      }
    } catch (err) {
      toast.error("Erro ao concluir módulo");
    } finally {
      setCompletingModule(null);
    }
  }

  return (
    <div className="">
      <Accordion type="single" collapsible className="w-full ">
        {Object.entries(modules)
          .sort((a, b) =>
            a[0].localeCompare(b[0], undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
          .map(([title, lessons], index) => (
            <AccordionItem
              className="p-4 "
              value={`${title}-${index}`}
              key={`${title}-${index}`}
            >
              <AccordionTrigger className="" title={title}>
                <div className="w-full flex items-center justify-between">
                  <div className="flex-1 space-y-2 pr-4">
                    <span className="line-clamp-1 text-sm text-left font-medium">
                      {title}
                    </span>

                    <ProgressCard
                      value={calculateCompletionPercentage(lessons)}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="shrink-0 text-white/50 hover:text-white"
                    disabled={completingModule === title}
                    onClick={(e) => handleCompleteModule(e, title, lessons)}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Concluir
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {lessons.map((lesson, index) => (
                  <LessonListItem
                    key={lesson.id}
                    lesson={lesson}
                    index={index + 1}
                    onSelect={() => {
                      onLessonSelect(lesson);
                    }}
                    selectedLessonId={selectedLessonId}
                    onComplete={handleCompleteLesson}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}
