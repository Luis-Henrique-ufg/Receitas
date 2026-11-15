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
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders metrics, streak and expandable 365-day matrix after loading stats", async () => {
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
          date: todayIso,
          study_seconds: 1800,
          pomodoros: 1,
          lessons: 1,
          level: 2,
          courses: [{ id: 1, name: "Estatística", seconds: 1800, pomodoros: 0 }],
        },
      ],
    });

    render(<ActivityHeatmap />);

    await waitFor(() => {
      expect(screen.getByText(/5 Dias Seguidos de Foco/i)).toBeInTheDocument();
      expect(screen.getByText(/Recorde: 12 dias/i)).toBeInTheDocument();
      expect(screen.getByText(/1h 0m de estudo acumulados nesta semana/i)).toBeInTheDocument();
      expect(screen.getByText("Hoje")).toBeInTheDocument();
      expect(screen.getByText(/Ver matriz de 365 dias/i)).toBeInTheDocument();
    });

    // Expand matrix
    fireEvent.click(screen.getByText(/Ver matriz de 365 dias/i));

    await waitFor(() => {
      expect(screen.getByText("Todas as matérias")).toBeInTheDocument();
      expect(screen.getByText("Ocultar matriz anual")).toBeInTheDocument();
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
      days: [{ date: todayIso, study_seconds: 600, pomodoros: 0, lessons: 1, level: 1 }],
    });

    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 Dia Seguido de Foco/i)).toBeInTheDocument();
      expect(screen.getByText("Hoje")).toBeInTheDocument();
    });
  });
});
