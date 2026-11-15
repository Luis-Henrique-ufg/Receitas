import { Course } from "@/models/models";

export interface CategoryTagStyle {
  label: string;
  bgColor: string;
  textColor: string;
}

export const PRESET_COURSE_CATEGORIES: CategoryTagStyle[] = [
  { label: "Engenharia", bgColor: "#FF7020", textColor: "#030607" },
  { label: "Programação", bgColor: "#FF7020", textColor: "#030607" },
  { label: "Inteligência", bgColor: "#E33D6C", textColor: "#FFFFFF" },
  { label: "Literatura", bgColor: "#00A196", textColor: "#FFFFFF" },
  { label: "Humanidades", bgColor: "#00A196", textColor: "#FFFFFF" },
  { label: "Simbologia", bgColor: "#663399", textColor: "#FFFFFF" },
  { label: "Ciências & Dados", bgColor: "#FFAB3B", textColor: "#030607" },
  { label: "Arquitetura", bgColor: "#EA3600", textColor: "#FFFFFF" },
  { label: "Arte & Design", bgColor: "#B70B6C", textColor: "#FFFFFF" },
];

const FALLBACK_PALETTE: CategoryTagStyle[] = [
  { label: "Engenharia", bgColor: "#FF7020", textColor: "#030607" },
  { label: "Literatura", bgColor: "#00A196", textColor: "#FFFFFF" },
  { label: "Inteligência", bgColor: "#E33D6C", textColor: "#FFFFFF" },
  { label: "Simbologia", bgColor: "#663399", textColor: "#FFFFFF" },
  { label: "Ciências & Dados", bgColor: "#FFAB3B", textColor: "#030607" },
];

const COLOR_PAIRS: Array<{ bgColor: string; textColor: string }> = [
  { bgColor: "#FF7020", textColor: "#030607" },
  { bgColor: "#00A196", textColor: "#FFFFFF" },
  { bgColor: "#E33D6C", textColor: "#FFFFFF" },
  { bgColor: "#663399", textColor: "#FFFFFF" },
  { bgColor: "#FFAB3B", textColor: "#030607" },
  { bgColor: "#EA3600", textColor: "#FFFFFF" },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function styleForCategoryLabel(label: string): CategoryTagStyle {
  const normalized = label.trim().toLowerCase();
  const preset = PRESET_COURSE_CATEGORIES.find(
    (p) => p.label.toLowerCase() === normalized
  );
  if (preset) {
    return { ...preset, label: label.trim() };
  }

  if (
    /intelig[êe]ncia|ia\b|ai\b|claude|gpt|llm|prompt|machine|neural/.test(normalized)
  ) {
    return { label: label.trim(), bgColor: "#E33D6C", textColor: "#FFFFFF" };
  }
  if (
    /literatura|humanidades|hist[óo]ria|filosofia|idioma|ingl[êe]s|letras/.test(normalized)
  ) {
    return { label: label.trim(), bgColor: "#00A196", textColor: "#FFFFFF" };
  }
  if (/simbologia|arte|design|psicologia|m[úu]sica|cultura/.test(normalized)) {
    return { label: label.trim(), bgColor: "#663399", textColor: "#FFFFFF" };
  }
  if (/dados|matem[áa]tica|estat[íi]stica|finan[çc]as|ci[êe]ncias|exatas/.test(normalized)) {
    return { label: label.trim(), bgColor: "#FFAB3B", textColor: "#030607" };
  }
  if (/engenharia|programa[çc][ãa]o|dev|c[óo]digo|arquitetura|sistemas/.test(normalized)) {
    return { label: label.trim(), bgColor: "#FF7020", textColor: "#030607" };
  }

  const pair = COLOR_PAIRS[hashString(normalized) % COLOR_PAIRS.length];
  return {
    label: label.trim(),
    bgColor: pair.bgColor,
    textColor: pair.textColor,
  };
}

export function getCourseCategoryTag(course: Course): CategoryTagStyle {
  // 1. Explicit category on Course object
  if (course.category && course.category.trim()) {
    return styleForCategoryLabel(course.category);
  }

  // 2. Check localStorage fallback map if user saved category locally
  try {
    const raw = localStorage.getItem("courseCategories");
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      const saved = map[String(course.id)];
      if (saved && saved.trim()) {
        return styleForCategoryLabel(saved);
      }
    }
  } catch {
    // Ignore storage read error
  }

  // 3. Smart inference from course name & path
  const text = `${course.name || ""} ${course.path || ""}`.toLowerCase();

  if (
    /\b(claude|ia|ai|gpt|llm|agentes?|prompt|machine learning|deep learning|redes neurais)\b/.test(
      text
    )
  ) {
    return { label: "Inteligência", bgColor: "#E33D6C", textColor: "#FFFFFF" };
  }

  if (
    /\b(dostoi[ée]vski|tolst[óo]i|literatura|romance|poesia|livro|escrita|gram[áa]tica|ingl[êe]s|franc[êe]s|russo|idioma)\b/.test(
      text
    )
  ) {
    return { label: "Literatura", bgColor: "#00A196", textColor: "#FFFFFF" };
  }

  if (
    /\b(simbologia|mito|mitologia|jung|arqu[ée]tipo|religi[ãa]o|teologia|esoterismo|ocultismo)\b/.test(
      text
    )
  ) {
    return { label: "Simbologia", bgColor: "#663399", textColor: "#FFFFFF" };
  }

  if (
    /\b(filosofia|hist[óo]ria|sociologia|pol[íi]tica|direito|[ée]tica|humanidades|psicologia)\b/.test(
      text
    )
  ) {
    return { label: "Humanidades", bgColor: "#00A196", textColor: "#FFFFFF" };
  }

  if (
    /\b(estat[íi]stica|matem[áa]tica|c[áa]lculo|[áa]lgebra|dados|data|sql|analytics|finan[çc]as|economia|probabilidade)\b/.test(
      text
    )
  ) {
    return { label: "Ciências & Dados", bgColor: "#FFAB3B", textColor: "#030607" };
  }

  if (
    /\b(caligrafia|design|figma|ui|ux|arte|desenho|fotografia|v[íi]deo|edi[çc][ãa]o|m[úu]sica)\b/.test(
      text
    )
  ) {
    return { label: "Arte & Design", bgColor: "#B70B6C", textColor: "#FFFFFF" };
  }

  if (
    /\b(arquitetura|microsservi[çc]os|clean|devops|docker|kubernetes|cloud|aws|linux|redes|infraestrutura)\b/.test(
      text
    )
  ) {
    return { label: "Arquitetura", bgColor: "#EA3600", textColor: "#FFFFFF" };
  }

  if (
    /\b(linguagem c|c\+\+|c#|python|java|javascript|typescript|react|node|rust|golang|algoritmos?|estrutura de dados|programa[çc][ãa]o|c[óo]digo|dev|backend|frontend|web|software|engenharia)\b/.test(
      text
    )
  ) {
    return { label: "Engenharia", bgColor: "#FF7020", textColor: "#030607" };
  }

  // Deterministic fallback from Tangerina palette
  const idx = Math.abs(course.id || 0) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[idx];
}

export function saveLocalCourseCategory(courseId: number, category: string) {
  try {
    const raw = localStorage.getItem("courseCategories");
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (category.trim()) {
      map[String(courseId)] = category.trim();
    } else {
      delete map[String(courseId)];
    }
    localStorage.setItem("courseCategories", JSON.stringify(map));
  } catch {
    // Ignore storage write error
  }
}

export function parseCoverPosition(posStr?: string | null): { x: number; y: number } {
  if (!posStr || !posStr.trim()) {
    return { x: 50, y: 50 };
  }
  const matches = posStr.match(/(\d+(?:\.\d+)?)/g);
  if (matches && matches.length >= 2) {
    const x = Math.max(0, Math.min(100, Math.round(Number(matches[0]))));
    const y = Math.max(0, Math.min(100, Math.round(Number(matches[1]))));
    return { x, y };
  }
  return { x: 50, y: 50 };
}

export function getCourseCoverPosition(course: Course): string {
  try {
    const raw = localStorage.getItem("courseCoverPositions");
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      const saved = map[String(course.id)];
      if (saved && saved.trim()) {
        return saved.trim();
      }
    }
  } catch {
    // Ignore storage read error
  }
  if (course.coverPosition && course.coverPosition.trim()) {
    return course.coverPosition.trim();
  }
  return "50% 50%";
}

export function saveLocalCourseCoverPosition(courseId: number, position: string) {
  try {
    const raw = localStorage.getItem("courseCoverPositions");
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (position.trim()) {
      map[String(courseId)] = position.trim();
    } else {
      delete map[String(courseId)];
    }
    localStorage.setItem("courseCoverPositions", JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("courseCoverPositionUpdated"));
  } catch {
    // Ignore storage write error
  }
}
