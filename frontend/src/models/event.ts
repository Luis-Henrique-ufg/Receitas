export type EventCategory = "prova" | "entrega" | "revisao" | "lembrete";

export interface StudyEvent {
  id: number;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time?: string | null; // 'HH:mm'
  category: EventCategory;
  color?: string | null;
  notes?: string | null;
  done: boolean;
  subject_id?: number | null;
  subject_name?: string | null;
  subject_color?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time?: string | null;
  category: EventCategory;
  color?: string | null;
  notes?: string | null;
  subject_id?: number | null;
  course_id?: number | null;
  done?: boolean;
}


export type UpdateEventInput = Partial<CreateEventInput>;

export interface CategoryConfig {
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
  iconColorClass: string;
}

export const CATEGORY_CONFIGS: Record<EventCategory, CategoryConfig> = {
  prova: {
    label: "Prova",
    bgClass: "bg-[#E33D6C]/14 dark:bg-[#E33D6C]/20",
    borderClass: "border-[#E33D6C]/35 dark:border-[#E33D6C]/45",
    textClass: "text-[#B81D48] dark:text-[#FF8DA9]",
    dotClass: "bg-[#E33D6C]",
    iconColorClass: "text-[#E33D6C] dark:text-[#FF7096]",
  },
  entrega: {
    label: "Entrega",
    bgClass: "bg-primary/14 dark:bg-primary/20",
    borderClass: "border-primary/35 dark:border-primary/45",
    textClass: "text-[#C84B00] dark:text-[#FF9E66]",
    dotClass: "bg-primary",
    iconColorClass: "text-primary",
  },
  revisao: {
    label: "Revisão",
    bgClass: "bg-accent/14 dark:bg-accent/20",
    borderClass: "border-accent/35 dark:border-accent/45",
    textClass: "text-[#00756D] dark:text-[#47E0D4]",
    dotClass: "bg-accent",
    iconColorClass: "text-[#00A196] dark:text-[#33C7BC]",
  },
  lembrete: {
    label: "Lembrete",
    bgClass: "bg-[#8B5CF6]/14 dark:bg-[#8B5CF6]/20",
    borderClass: "border-[#8B5CF6]/35 dark:border-[#A78BFA]/45",
    textClass: "text-[#5B2C86] dark:text-[#D8B4FE]",
    dotClass: "bg-[#8B5CF6]",
    iconColorClass: "text-[#7C3AED] dark:text-[#C084FC]",
  },
};
