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
  color: string;
  solidBg: string;
  solidText: string;
  dotClass: string;
  iconColorClass: string;
  borderAccentClass: string;
  cardStripeClass: string;
  activeBorderClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const CATEGORY_CONFIGS: Record<EventCategory, CategoryConfig> = {
  prova: {
    label: "Prova",
    color: "#E33D6C",
    solidBg: "#E33D6C",
    solidText: "#FFFFFF",
    dotClass: "bg-[#E33D6C]",
    iconColorClass: "text-[#E33D6C]",
    borderAccentClass: "border-l-[#E33D6C]",
    cardStripeClass: "before:bg-[#E33D6C]",
    activeBorderClass: "border-[#E33D6C]",
    bgClass: "bg-[#E33D6C]",
    borderClass: "border-transparent",
    textClass: "text-white",
  },
  entrega: {
    label: "Entrega",
    color: "#FF7020",
    solidBg: "#FF7020",
    solidText: "#030607",
    dotClass: "bg-primary",
    iconColorClass: "text-primary",
    borderAccentClass: "border-l-primary",
    cardStripeClass: "before:bg-primary",
    activeBorderClass: "border-primary",
    bgClass: "bg-primary",
    borderClass: "border-transparent",
    textClass: "text-[#030607]",
  },
  revisao: {
    label: "Revisão",
    color: "#00A196",
    solidBg: "#00A196",
    solidText: "#FFFFFF",
    dotClass: "bg-accent",
    iconColorClass: "text-accent",
    borderAccentClass: "border-l-accent",
    cardStripeClass: "before:bg-accent",
    activeBorderClass: "border-accent",
    bgClass: "bg-accent",
    borderClass: "border-transparent",
    textClass: "text-white",
  },
  lembrete: {
    label: "Lembrete",
    color: "#8B5CF6",
    solidBg: "#663399",
    solidText: "#FFFFFF",
    dotClass: "bg-[#8B5CF6]",
    iconColorClass: "text-[#8B5CF6]",
    borderAccentClass: "border-l-[#8B5CF6]",
    cardStripeClass: "before:bg-[#8B5CF6]",
    activeBorderClass: "border-[#8B5CF6]",
    bgClass: "bg-[#663399]",
    borderClass: "border-transparent",
    textClass: "text-white",
  },
};
