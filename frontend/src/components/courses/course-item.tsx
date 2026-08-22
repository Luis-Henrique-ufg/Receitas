import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import { GripHorizontal } from "lucide-react";

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

  const courseCover = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : "/sem-foto.png";

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
        <div className="relative z-10 p-0 cursor-pointer" onClick={onPlay}>
          <div className="relative w-full aspect-video overflow-hidden border-b border-white/10 [transform:translateZ(0)] [backface-visibility:hidden]">
             <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform [backface-visibility:hidden] [transform:translate3d(0,0,0)]"
              src={courseCover}
              alt={course.name}
            />
          </div>
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
        <div className="flex gap-2.5 justify-center items-center w-full">
          {isEditable ? (
            <>
              <EditCourse course={course} onUpdate={onUpdate} />
              <DeleteCourse course={course} onUpdate={onUpdate} />
            </>
          ) : null}
          <Button size="sm" onClick={onPlay}>
            Assistir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
