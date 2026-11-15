import useSelectedLesson from "@/hooks/useSelectedLesson";
import { Lesson } from "@/models/models";
import { getLastViewedLesson } from "@/utils/utils";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

type Props = {
  courseId: string;
};

export default function LastWatchedCard({ courseId }: Props) {
  const [lesson, setLesson] = useState<Lesson | undefined>();

  const { selectLesson, selectedLesson } = useSelectedLesson();

  useEffect(() => {
    const lastWatched = getLastViewedLesson(courseId);

    if (!selectedLesson) {
      return; // Wait until selectedLesson is populated to verify
    }

    if (lastWatched && lastWatched.id === selectedLesson.id) {
      setLesson(undefined);
      return;
    }

    if (lastWatched && lastWatched.course_title === selectedLesson.course_title) {
      setLesson(lastWatched);
    } else {
      setLesson(undefined);
    }
  }, [courseId, selectedLesson?.id]);

  if (!lesson) {
    return null;
  }

  return (
    <div className="px-4 py-3 text-xs border-b border-border bg-primary/10 flex items-center justify-between gap-3">
      <p className="text-foreground truncate">
        <strong className="font-semibold text-primary">Última aula:</strong>{" "}
        <span className="text-foreground/90">{lesson.title}</span>
      </p>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          className="h-7 px-2.5 text-[11px] rounded-lg bg-primary text-[#030607] font-semibold hover:brightness-105"
          onClick={() => {
            selectLesson(lesson);
            setLesson(undefined);
          }}
        >
          Ir
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => {
            setLesson(undefined);
          }}
        >
          Ignorar
        </Button>
      </div>
    </div>
  );
}
