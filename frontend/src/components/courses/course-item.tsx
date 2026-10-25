import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "../ui/card";
import { Course } from "@/models/models";
import { Button } from "../ui/button";
import DeleteCourse from "./delete-course";
import EditCourse from "./edit-course";
import useApiUrl from "@/hooks/useApiUrl";
import CoursePercentage from "../course-percentage";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, Play, Edit3, Trash2 } from "lucide-react";
import { getLastViewedLesson } from "@/utils/utils";

type Props = {
  course: Course;
  onPlay: () => void;
  isEditable?: boolean;
  onUpdate: () => void;
};

export default function CourseItem({
  course,
  onPlay,
  isEditable,
  onUpdate,
}: Props) {
  const { apiUrl } = useApiUrl();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const courseCover = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : "/sem-foto.png";

  const lastWatched = getLastViewedLesson(course.id.toString());
  const ctaLabel = lastWatched
    ? `Continuar: ${lastWatched.title}`
    : "Iniciar Curso";

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...(isEditable ? attributes : {})}
      {...(isEditable ? listeners : {})}
      className={`group relative overflow-hidden transition-all duration-300 flex flex-col justify-between h-full ${isDragging ? "shadow-2xl ring-2 ring-[#007bff] z-50 opacity-80" : "shadow-md hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,123,255,0.15)]"} ${isEditable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#007bff]/10 to-purple-900/20 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="flex flex-col flex-1">
        {/* Cover with top-right actions menu */}
        <div className="relative w-full aspect-video overflow-hidden border-b border-white/10 [transform:translateZ(0)] [backface-visibility:hidden]">
          <div className="w-full h-full cursor-pointer" onClick={onPlay}>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform [backface-visibility:hidden] [transform:translate3d(0,0,0)]"
              src={courseCover}
              alt={course.name}
            />
          </div>

          {/* Contextual actions menu (⋯) */}
          {isEditable && (
            <div
              ref={menuRef}
              className="absolute top-2.5 right-2.5 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md shadow-lg flex items-center justify-center transition-all focus:outline-none"
                title="Opções do curso"
                aria-label="Opções do curso"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl glass-panel border border-white/15 shadow-2xl backdrop-blur-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-40 bg-[#050a14]/95">
                  <EditCourse
                    course={course}
                    onUpdate={() => {
                      setIsMenuOpen(false);
                      onUpdate();
                    }}
                    trigger={
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center gap-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Editar dados</span>
                      </button>
                    }
                  />

                  <DeleteCourse
                    course={course}
                    onUpdate={() => {
                      setIsMenuOpen(false);
                      onUpdate();
                    }}
                    trigger={
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 rounded-lg transition-colors cursor-pointer mt-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir curso</span>
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-3 px-4 py-4 pt-4 relative z-10 flex-1 justify-between">
          <CardTitle
            className="text-white text-base text-left font-heading tracking-tight line-clamp-2 h-12 leading-snug flex items-start"
            title={course.name}
          >
            {course.name}
          </CardTitle>

          <div className="w-full mt-auto">
            <CoursePercentage courseId={course.id} />
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-2 relative z-10 mt-auto shrink-0 border-t border-white/5">
        <Button
          size="sm"
          onClick={onPlay}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-[#007bff] hover:from-blue-500 hover:to-blue-600 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
          title={ctaLabel}
        >
          <Play className="w-3.5 h-3.5 fill-white shrink-0" />
          <span className="truncate max-w-[210px]">{ctaLabel}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

