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

    expect(screen.getByText("Comece a estudar")).toBeInTheDocument();
    expect(screen.getByText("Claude Impressionador")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar Curso/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Iniciar Curso/i }));
    expect(onPlay).toHaveBeenCalledWith(1, undefined);
  });

  it("renders resume state with clean lesson hierarchy and 'Retomar em' when elapsed > 0", async () => {
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

    expect(screen.getByText("Continuar de onde parei")).toBeInTheDocument();
    expect(screen.getByText("Claude Impressionador")).toBeInTheDocument();
    // Cleaned titles without numeric prefixes
    expect(screen.getByText("Módulo 1")).toBeInTheDocument();
    expect(screen.getByText("Introdução aos Modelos")).toBeInTheDocument();
    // New 'Retomar em' badge
    expect(screen.getByText(/Retomar em/i)).toBeInTheDocument();
    expect(screen.getByText("02:30")).toBeInTheDocument();
    // 'assistidos' is no longer displayed
    expect(screen.queryByText("assistidos")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continuar$/i })).toBeInTheDocument();

    // Check lesson number formatting
    await waitFor(() => {
      expect(screen.getByText(/Aula 1 de 40/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
    expect(onPlay).toHaveBeenCalled();
  });

  it("hides elapsed position badge when time_elapsed is zero", () => {
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

    expect(screen.getByText("Continuar de onde parei")).toBeInTheDocument();
    expect(screen.queryByText(/Retomar em/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/assistidos/i)).not.toBeInTheDocument();
  });
});
