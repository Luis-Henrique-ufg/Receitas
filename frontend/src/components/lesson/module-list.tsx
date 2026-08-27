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
  getLessonStats,
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
    if (selectedLessonId && Object.keys(modules).length > 0) {
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
        const targetModuleKey = `${title}-${activeEntryIndex}`;
        if (!currentModule || currentModule !== targetModuleKey) {
          handleModuleChange(targetModuleKey);
        }
      }
    }
  }, [selectedLessonId, modules]);

  useEffect(() => {
    if (!selectedLessonId) return;

    let timeoutId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 12;

    const tryScroll = () => {
      const el = document.getElementById(`lesson-item-${selectedLessonId}`);
      if (el) {
        const container = el.closest('.overflow-y-auto') || el.closest('[data-radix-scroll-area-viewport]');
        const elRect = el.getBoundingClientRect();

        // Verificar se o elemento já foi renderizado com altura válida
        if (elRect.height > 0) {
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const relativeTop = elRect.top - containerRect.top;
            const targetScrollTop = container.scrollTop + relativeTop - (containerRect.height / 2) + (elRect.height / 2);

            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        timeoutId = setTimeout(tryScroll, 100);
      }
    };

    // Iniciar tentativas de rolagem após leve atraso para permitir expansão do acordeão
    timeoutId = setTimeout(tryScroll, 150);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedLessonId, currentModule]);

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
      const incompleteLessons = lessons.filter((l) => !l.isCompleted);
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
          .map(([title, lessons], index) => {
            const validLessons = lessons.filter((l) => {
              const url = (l.video_url || l.pdf_url || "").toLowerCase();
              return !url.endsWith(".html") && !url.endsWith(".htm") && !url.endsWith(".txt");
            });
            const stats = getLessonStats(validLessons);

            return (
              <AccordionItem
                className="px-4 py-2 w-full min-w-0"
                value={`${title}-${index}`}
                key={`${title}-${index}`}
              >
                <AccordionTrigger className="w-full min-w-0" title={title}>
                  <div className="w-full flex items-start justify-between group/module min-w-0">
                    <div className="flex-1 space-y-2 pr-4 text-left min-w-0">
                      <div className="text-sm font-medium text-white/90 leading-relaxed font-heading truncate mt-1">
                        {title.split("/").pop()?.trim()}
                      </div>

                      <ProgressCard
                        value={stats.percentage}
                        totalLessons={stats.total}
                        completedLessons={stats.completed}
                        showTitle={false}
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
                                checked={stats.percentage === 100}
                                className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white w-5 h-5 pointer-events-none transition-all duration-300"
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
                  {validLessons.map((lesson, index) => (
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
            );
          })}
      </Accordion>
    </div>
  );
}
