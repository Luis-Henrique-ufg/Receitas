import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ActivityHeatmap from "@/components/stats/activity-heatmap";
import { statsApi } from "@/services/statsApi";

vi.mock("@/services/statsApi", () => ({
  statsApi: {
    getHeatmap: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
}));

describe("ActivityHeatmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders metrics, streak and course dropdown after loading stats", async () => {
    vi.mocked(statsApi.getHeatmap).mockResolvedValueOnce({
      current_streak: 5,
      max_streak: 12,
      total_seconds: 7200,
      total_pomodoros: 4,
      total_lessons: 6,
      today_seconds: 1800,
      week_seconds: 3600,
      week_active_days: 2,
      delta_week_seconds: 1800,
      available_courses: [{ id: 1, name: "Estatística" }],
      available_subjects: [{ id: 1, name: "Estatística", color: "#f59e0b" }],
      days: [
        {
          date: "2026-10-20",
          study_seconds: 1800,
          pomodoros: 1,
          lessons: 1,
          level: 2,
          courses: [{ id: 1, name: "Estatística", seconds: 1800, pomodoros: 0 }],
        },
        { date: "2026-10-21", study_seconds: 1800, pomodoros: 1, lessons: 1, level: 2 },
      ],
    });

    render(<ActivityHeatmap />);

    await waitFor(() => {
      expect(screen.getByText("Hoje")).toBeInTheDocument();
      expect(screen.getByText("30 min")).toBeInTheDocument();
      expect(screen.getByText("Esta semana")).toBeInTheDocument();
      expect(screen.getByText("1h 0m")).toBeInTheDocument();
      expect(screen.getByText("+30 min")).toBeInTheDocument();
      expect(screen.getByText("5 dias")).toBeInTheDocument();
      expect(screen.getByText("(recorde: 12)")).toBeInTheDocument();
      expect(screen.getByText("14 sem")).toBeInTheDocument();
      expect(screen.getByText("Ano")).toBeInTheDocument();
      expect(screen.getByText("Todas as matérias")).toBeInTheDocument();
      expect(screen.getByText("Estatística")).toBeInTheDocument();
    });
  });

  it("renders distinct error state when loading fails and allows retry", async () => {
    vi.mocked(statsApi.getHeatmap).mockRejectedValueOnce(new Error("Network Error"));

    render(<ActivityHeatmap />);

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar o histórico de estudos")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeInTheDocument();
    });

    // Test retry
    vi.mocked(statsApi.getHeatmap).mockResolvedValueOnce({
      current_streak: 1,
      max_streak: 1,
      total_seconds: 600,
      total_pomodoros: 0,
      total_lessons: 1,
      today_seconds: 600,
      week_seconds: 600,
      week_active_days: 1,
      delta_week_seconds: 600,
      available_courses: [],
      days: [{ date: "2026-10-25", study_seconds: 600, pomodoros: 0, lessons: 1, level: 1 }],
    });

    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByText("Hoje")).toBeInTheDocument();
      expect(screen.getAllByText("10 min").length).toBeGreaterThanOrEqual(1);
    });
  });
});
