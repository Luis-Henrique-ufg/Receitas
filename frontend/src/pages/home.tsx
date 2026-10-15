import CoursesList from "@/components/courses/courses-list";

export default function HomeScreen() {
  return (
    <div className="py-6 w-full text-left">
      <h1 className="text-3xl font-heading font-medium tracking-tight">Minhas receitas</h1>
      <div className="mt-10 flex flex-wrap gap-4 w-full justify-center">
        <CoursesList courses={null} />
      </div>
    </div>
  );
}
