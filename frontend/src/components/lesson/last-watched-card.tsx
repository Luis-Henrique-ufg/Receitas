import useSelectedLesson from "@/hooks/useSelectedLesson";
import { Lesson } from "@/models/models";
import { getLastViewedLesson, setLastViewedLesson } from "@/utils/utils";
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
    <div className="p-4 text-sm border space-y-2">
      <p className="">
        <strong>Ultimo Conteúdo aberto:</strong> {lesson.title}{" "}
      </p>
      <div className="space-x-4">
        <Button
          size="sm"
          onClick={() => {
            selectLesson(lesson);
            setLesson(undefined);
          }}
        >
          Visualizar
        </Button>

        <Button
          variant="secondary"
          size="sm"
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
