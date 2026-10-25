import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ResumeHeroCard from "@/components/courses/resume-hero-card";
import { Course } from "@/models/models";

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
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

    expect(screen.getByText("Comece a Estudar")).toBeInTheDocument();
    expect(screen.getByText("Claude Impressionador")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar Curso/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Iniciar Curso/i }));
    expect(onPlay).toHaveBeenCalledWith(1, undefined);
  });

  it("renders resume state when lastViewedLesson exists in localStorage", () => {
    localStorage.setItem(
      "1",
      JSON.stringify({
        id: 101,
        title: "01 - Introdução aos Modelos",
        module: "Módulo 1",
        time_elapsed: 150,
      })
    );

    const onPlay = vi.fn();
    render(<ResumeHeroCard courses={mockCourses} onPlay={onPlay} />);

    expect(screen.getByText("Continuar de Onde Parei")).toBeInTheDocument();
    expect(screen.getByText("Claude Impressionador")).toBeInTheDocument();
    expect(screen.getByText("01 - Introdução aos Modelos")).toBeInTheDocument();
    expect(screen.getByText("02:30")).toBeInTheDocument();
    expect(screen.getByText("assistidos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continuar$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));

    expect(onPlay).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ id: 101, title: "01 - Introdução aos Modelos" })
    );
  });
});
