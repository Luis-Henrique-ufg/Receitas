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
  isHeroCourse?: boolean;
  onUpdate: () => void;
};

export default function CourseItem({
  course,
  onPlay,
  isEditable,
  isHeroCourse = false,
  onUpdate,
}: Props) {
  const { apiUrl } = useApiUrl();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  const ctaLabel = lastWatched ? "Continuar" : "Iniciar";

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...(isEditable ? attributes : {})}
      {...(isEditable ? listeners : {})}
      className={`group relative overflow-hidden transition-all duration-300 flex flex-col justify-between h-full ${
        isDragging
          ? "shadow-2xl ring-2 ring-primary z-50 opacity-80"
          : "hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-md"
      } ${isEditable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="flex flex-col flex-1">
        {/* Cover with top-right actions menu */}
        <div className="relative w-full aspect-video overflow-hidden border-b border-border/80">
          <div className="w-full h-full cursor-pointer" onClick={onPlay}>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
              src={courseCover}
              alt={course.name}
            />
          </div>

          {isHeroCourse && (
            <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
              <span className="bg-primary/20 text-primary border border-primary/30 rounded-full text-[11px] font-semibold px-2.5 py-1 backdrop-blur-md shadow-sm inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Em foco
              </span>
            </div>
          )}

          {/* Contextual actions menu */}
          {isEditable && (
            <div
              ref={menuRef}
              className="absolute top-2.5 right-2.5 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 rounded-full bg-card/80 hover:bg-card text-foreground/80 hover:text-foreground border border-border/80 backdrop-blur-md shadow-sm flex items-center justify-center transition-all focus:outline-none cursor-pointer"
                title="Opções do curso"
                aria-label="Opções do curso"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl bg-card border border-border shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditDialogOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground/90 hover:text-foreground hover:bg-secondary/70 flex items-center gap-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    <span>Editar dados</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-lg transition-colors cursor-pointer mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir curso</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-3 px-4 py-4 pt-4 relative z-10 flex-1 justify-between">
          <CardTitle
            className="text-foreground text-base text-left font-heading font-semibold tracking-tight line-clamp-2 h-12 leading-snug flex items-start"
            title={course.name}
          >
            {course.name}
          </CardTitle>

          <div className="w-full mt-auto">
            <CoursePercentage courseId={course.id} />
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-2 relative z-10 mt-auto shrink-0 border-t border-border/60">
        <Button
          size="sm"
          onClick={onPlay}
          className="w-full h-10 rounded-xl font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          <span>{ctaLabel}</span>
        </Button>
      </CardFooter>

      {/* Controlled Dialogs */}
      <EditCourse
        course={course}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={() => {
          setIsEditDialogOpen(false);
          onUpdate();
        }}
      />

      <DeleteCourse
        course={course}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onUpdate={() => {
          setIsDeleteDialogOpen(false);
          onUpdate();
        }}
      />
    </Card>
  );
}
