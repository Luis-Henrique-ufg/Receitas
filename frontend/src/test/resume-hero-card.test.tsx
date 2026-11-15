import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResumeHeroCard from "@/components/courses/resume-hero-card";
import { Course } from "@/models/models";

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
}));

vi.mock("@/services/coursesApi", () => ({
  coursesApi: {
    getCompletionStats: vi.fn().mockResolvedValue({
      total_lessons: 40,
      completed_lessons: 5,
    }),
  },
}));

const mockCourses: Course[] = [
  {
    id: 1,
    name: "Claude Impressionador",
    path: "/courses/claude",
    isCoverUrl: false,
    fileCover: "claude.jpg",
  },
  {
    id: 2,
    name: "Curso de Estatística",
    path: "/courses/stats",
    isCoverUrl: false,
  },
];

describe("ResumeHeroCard Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders default call-to-action when no history in localStorage", () => {
    const onPlay = vi.fn();
    render(<ResumeHeroCard courses={mockCourses} onPlay={onPlay} />);

    expect(screen.getByText("Estudo Ativo")).toBeInTheDocument();
    expect(screen.getByText("Claude Impressionador")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar Curso/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Iniciar Curso/i }));
    expect(onPlay).toHaveBeenCalledWith(1, undefined);
  });

  it("renders resume state with clean lesson hierarchy and 'Retomar Aula' when history exists", async () => {
    localStorage.setItem(
      "1",
      JSON.stringify({
        id: 101,
        title: "001 - Introdução aos Modelos",
        module: "002 - Módulo 1",
        time_elapsed: 150,
      })
    );

    const onPlay = vi.fn();
    render(<ResumeHeroCard courses={mockCourses} onPlay={onPlay} />);

    expect(screen.getByText("Continuar de onde parou")).toBeInTheDocument();
    expect(screen.getByText("Claude Impressionador")).toBeInTheDocument();
    // Cleaned titles without numeric prefixes
    expect(screen.getByText("Módulo 1")).toBeInTheDocument();
    expect(screen.getByText("Introdução aos Modelos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retomar Aula/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Progresso:/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Retomar Aula/i }));
    expect(onPlay).toHaveBeenCalled();
  });

  it("renders with clean progress display when time_elapsed is zero", () => {
    localStorage.setItem(
      "1",
      JSON.stringify({
        id: 101,
        title: "001 - Introdução aos Modelos",
        module: "002 - Módulo 1",
        time_elapsed: 0,
      })
    );

    const onPlay = vi.fn();
    render(<ResumeHeroCard courses={mockCourses} onPlay={onPlay} />);

    expect(screen.getByText("Continuar de onde parou")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retomar Aula/i })).toBeInTheDocument();
  });
});
