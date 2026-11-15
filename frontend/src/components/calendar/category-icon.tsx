import { EventCategory } from "@/models/event";
import { GraduationCap, FileUp, BookMarked, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: EventCategory;
  className?: string;
}

export default function CategoryIcon({ category, className }: CategoryIconProps) {
  const baseClass = cn("w-3.5 h-3.5 shrink-0 stroke-[2.2]", className);

  switch (category) {
    case "prova":
      return <GraduationCap className={baseClass} />;
    case "entrega":
      return <FileUp className={baseClass} />;
    case "revisao":
      return <BookMarked className={baseClass} />;
    case "lembrete":
    default:
      return <Bell className={baseClass} />;
  }
}
