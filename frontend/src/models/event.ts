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
    bgClass: "bg-white/[0.04]",
    borderClass: "border-white/10",
    textClass: "text-zinc-200",
    dotClass: "bg-rose-400 shadow-[0_0_8px_#fb7185]",
  },
  entrega: {
    label: "Entrega",
    bgClass: "bg-white/[0.04]",
    borderClass: "border-white/10",
    textClass: "text-zinc-200",
    dotClass: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
  },
  revisao: {
    label: "Revisão",
    bgClass: "bg-white/[0.04]",
    borderClass: "border-white/10",
    textClass: "text-zinc-200",
    dotClass: "bg-sky-400 shadow-[0_0_8px_#38bdf8]",
  },
  lembrete: {
    label: "Lembrete",
    bgClass: "bg-white/[0.04]",
    borderClass: "border-white/10",
    textClass: "text-zinc-200",
    dotClass: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
  },
};
