import { Course } from "@/models/models";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import CourseItem from "./course-item";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

type Props = {
  isEditable?: boolean;
  courses: Course[] | null;
  onPlay?: (courseId: number) => void;
  onRefresh?: () => void;
  onReorder?: (courses: Course[]) => Promise<void>;
};

export default function CoursesList({
  isEditable = false,
  courses,
  onPlay = () => {},
  onRefresh = () => {},
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!courses || !over || active.id === over.id) {
      return;
    }

    const oldIndex = courses.findIndex((c) => c.id.toString() === active.id);
    const newIndex = courses.findIndex((c) => c.id.toString() === over.id);

    const nextCourses = courses.slice();
    const [movedCourse] = nextCourses.splice(oldIndex, 1);
    nextCourses.splice(newIndex, 0, movedCourse);

    if (onReorder) {
      await onReorder(nextCourses);
    }
  }

  return (
    <>
      <div className="w-full">
        {Array.isArray(courses) && courses.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <SortableContext
                items={courses.map((c) => c.id.toString())}
                strategy={rectSortingStrategy}
              >
                {courses.map((course) => (
                  <CourseItem
                    key={course.id}
                    course={course}
                    onPlay={() => onPlay(course.id)}
                    isEditable={isEditable}
                    onUpdate={onRefresh}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        ) : (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <CardHeader>
              <CardTitle className="text-[hsl(222.2,84%,4.9%)] dark:text-white text-center">
                Nenhum curso encontrado!
              </CardTitle>
            </CardHeader>
            <CardDescription className=" px-4 pb-4 text-center">
              Que tal cadastrar o primeiro?
            </CardDescription>
          </Card>
        )}
      </div>
    </>
  );
}
