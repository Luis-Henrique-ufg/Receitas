import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressCard from "@/components/progress-card";

describe("ProgressCard Component", () => {
  it("renders 0% state as 'Não iniciado'", () => {
    render(<ProgressCard value={0} totalLessons={10} completedLessons={0} />);
    expect(screen.getByText("Seu progresso")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Não iniciado")).toBeInTheDocument();
    expect(screen.getByText("10 aulas restantes")).toBeInTheDocument();
  });

  it("renders in-progress state with remaining hours and estimate without uninformative badge", () => {
    render(
      <ProgressCard
        value={50}
        totalLessons={10}
        completedLessons={5}
        remainingSeconds={50400}
        estimatedFinishMonth="março"
      />
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("· termina em ~março")).toBeInTheDocument();
    expect(screen.queryByText("Em andamento")).not.toBeInTheDocument();
    expect(screen.getByText("~14 h restantes")).toBeInTheDocument();
  });

  it("renders 100% completed state", () => {
    render(<ProgressCard value={100} totalLessons={8} completedLessons={8} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Concluído")).toBeInTheDocument();
    expect(screen.getByText("Todas as 8 aulas concluídas!")).toBeInTheDocument();
  });
});

