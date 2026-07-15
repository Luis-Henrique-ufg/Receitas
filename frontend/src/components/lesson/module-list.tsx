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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import { toast } from "sonner";
import ProgressCard from "../progress-card";
import { Button } from "../ui/button";
import { CheckCheck, Loader2 } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import useApiUrl from "@/hooks/useApiUrl";
import { completeLesson } from "@/services/videoPlayer";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentModule = searchParams.get("module") || "";

  const handleModuleChange = (value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set("module", value);
      else prev.delete("module");
      return prev;
    }, { replace: true });
  };

  useEffect(() => {
    if (selectedLessonId && !currentModule) {
      // Encontrar módulo que contém a aula atual
      const sortedModules = Object.entries(modules).sort((a, b) =>
        a[0].localeCompare(b[0], undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
      const activeEntryIndex = sortedModules.findIndex(([_, lessons]) => 
        lessons.some(l => l.id === selectedLessonId)
      );
      if (activeEntryIndex !== -1) {
        const title = sortedModules[activeEntryIndex][0];
        handleModuleChange(`${title}-${activeEntryIndex}`);
      }
    }
  }, [selectedLessonId, modules, currentModule]);

  useEffect(() => {
    if (selectedLessonId) {
      const el = document.getElementById(`lesson-item-${selectedLessonId}`);
      if (el) {
        // Atrasar levemente para garantir que o acordeão expandiu
        setTimeout(() => {
          const container = el.closest('.overflow-y-auto');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const relativeTop = elRect.top - containerRect.top;
            
            container.scrollBy({
              top: relativeTop - (containerRect.height / 2) + (elRect.height / 2),
              behavior: 'smooth'
            });
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [selectedLessonId]);

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
    <div className="w-full min-w-0">
      <Accordion type="single" collapsible className="w-full min-w-0" value={currentModule} onValueChange={handleModuleChange}>
        {Object.entries(modules)
          .sort((a, b) =>
            a[0].localeCompare(b[0], undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
          .map(([title, lessons], index) => (
            <AccordionItem
              className="p-4 w-full min-w-0"
              value={`${title}-${index}`}
              key={`${title}-${index}`}
            >
              <AccordionTrigger className="w-full min-w-0" title={title}>
                <div className="w-full flex items-start justify-between group/module min-w-0">
                  <div className="flex-1 space-y-2 pr-4 text-left min-w-0">
                    <div className="text-sm font-medium text-white/90 leading-relaxed font-heading truncate mt-1">
                      {title.split("/").map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="mx-2 text-white/30 text-[10px] font-sans">&gt;</span>
                          )}
                        </span>
                      ))}
                    </div>

                    <ProgressCard
                      value={calculateCompletionPercentage(lessons)}
                    />
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="p-1 flex items-center justify-center min-w-[32px] min-h-[32px] shrink-0 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleCompleteModule(e, title, lessons); }}
                        >
                          {completingModule === title ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#007bff]" />
                          ) : (
                            <Checkbox 
                              checked={calculateCompletionPercentage(lessons) === 100}
                              className="border-white/30 data-[state=checked]:bg-[#007bff] data-[state=checked]:border-[#007bff] w-5 h-5 pointer-events-none"
                            />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Marcar módulo como concluído</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
