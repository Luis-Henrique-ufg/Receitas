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
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-300",
    dotClass: "bg-rose-400",
  },
  entrega: {
    label: "Entrega",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-300",
    dotClass: "bg-amber-400",
  },
  revisao: {
    label: "Revisão",
    bgClass: "bg-sky-500/15",
    borderClass: "border-sky-500/30",
    textClass: "text-sky-300",
    dotClass: "bg-sky-400",
  },
  lembrete: {
    label: "Lembrete",
    bgClass: "bg-purple-500/15",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-300",
    dotClass: "bg-purple-400",
  },
};
