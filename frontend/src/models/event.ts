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
}

export const CATEGORY_CONFIGS: Record<EventCategory, CategoryConfig> = {
  prova: {
    label: "Prova",
    bgClass: "bg-[#E33D6C]/12 dark:bg-[#E33D6C]/15",
    borderClass: "border-[#E33D6C]/30",
    textClass: "text-[#B81D48] dark:text-[#FF85A6]",
    dotClass: "bg-[#E33D6C]",
  },
  entrega: {
    label: "Entrega",
    bgClass: "bg-primary/12 dark:bg-primary/15",
    borderClass: "border-primary/30",
    textClass: "text-[#C84B00] dark:text-primary",
    dotClass: "bg-primary",
  },
  revisao: {
    label: "Revisão",
    bgClass: "bg-accent/12 dark:bg-accent/15",
    borderClass: "border-accent/30",
    textClass: "text-[#007A72] dark:text-[#33C7BC]",
    dotClass: "bg-accent",
  },
  lembrete: {
    label: "Lembrete",
    bgClass: "bg-[#663399]/12 dark:bg-[#663399]/20",
    borderClass: "border-[#663399]/30 dark:border-[#9B59B6]/35",
    textClass: "text-[#5B2C86] dark:text-[#D2B4DE]",
    dotClass: "bg-[#663399] dark:bg-[#9B59B6]",
  },
};
