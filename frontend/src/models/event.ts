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
    dotClass: "bg-[#E33D6C]",
    iconColorClass: "text-[#E33D6C]",
    borderAccentClass: "border-l-[#E33D6C]",
    cardStripeClass: "before:bg-[#E33D6C]",
    activeBorderClass: "border-[#E33D6C]",
    bgClass: "bg-secondary/80",
    borderClass: "border-border",
    textClass: "text-foreground",
  },
  entrega: {
    label: "Entrega",
    color: "#FF7020",
    dotClass: "bg-primary",
    iconColorClass: "text-primary",
    borderAccentClass: "border-l-primary",
    cardStripeClass: "before:bg-primary",
    activeBorderClass: "border-primary",
    bgClass: "bg-secondary/80",
    borderClass: "border-border",
    textClass: "text-foreground",
  },
  revisao: {
    label: "Revisão",
    color: "#00A196",
    dotClass: "bg-accent",
    iconColorClass: "text-accent",
    borderAccentClass: "border-l-accent",
    cardStripeClass: "before:bg-accent",
    activeBorderClass: "border-accent",
    bgClass: "bg-secondary/80",
    borderClass: "border-border",
    textClass: "text-foreground",
  },
  lembrete: {
    label: "Lembrete",
    color: "#8B5CF6",
    dotClass: "bg-[#8B5CF6]",
    iconColorClass: "text-[#8B5CF6]",
    borderAccentClass: "border-l-[#8B5CF6]",
    cardStripeClass: "before:bg-[#8B5CF6]",
    activeBorderClass: "border-[#8B5CF6]",
    bgClass: "bg-secondary/80",
    borderClass: "border-border",
    textClass: "text-foreground",
  },
};
