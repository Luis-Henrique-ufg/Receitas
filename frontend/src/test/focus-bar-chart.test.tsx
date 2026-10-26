import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FocusBarChart from "@/components/stats/focus-bar-chart";
import { statsApi } from "@/services/statsApi";

vi.mock("@/services/statsApi", () => ({
  statsApi: {
    getFocusBars: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
}));

describe("FocusBarChart Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders focus bar chart header, metrics, period switcher and legend", async () => {
    vi.mocked(statsApi.getFocusBars).mockResolvedValueOnce({
      period: "day",
      offset: 0,
      range_label: "13 Out — 26 Out 2026",
      start_date: "2026-10-13",
      end_date: "2026-10-26",
      total_study_seconds: 7200,
      total_pomodoros: 4,
      subjects: [
        {
          id: 1,
          name: "Estatística UFG",
          color: "#f59e0b",
          study_seconds: 5400,
          pomodoros: 3,
        },
        {
          id: null,
          name: "Sem matéria",
          color: "#64748b",
          study_seconds: 1800,
          pomodoros: 1,
        },
      ],
      bars: [
        {
          key: "2026-10-25",
          label: "25 Out",
          sublabel: "Dom",
          start_date: "2026-10-25",
          end_date: "2026-10-25",
          total_seconds: 3600,
          total_pomodoros: 2,
          breakdown: [
            {
              subject_id: 1,
              name: "Estatística UFG",
              color: "#f59e0b",
              seconds: 3600,
              pomodoros: 2,
            },
          ],
        },
        {
          key: "2026-10-26",
          label: "26 Out",
          sublabel: "Seg",
          start_date: "2026-10-26",
          end_date: "2026-10-26",
          total_seconds: 3600,
          total_pomodoros: 2,
          breakdown: [
            {
              subject_id: null,
              name: "Sem matéria",
              color: "#64748b",
              seconds: 1800,
              pomodoros: 1,
            },
            {
              subject_id: 1,
              name: "Estatística UFG",
              color: "#f59e0b",
              seconds: 1800,
              pomodoros: 1,
            },
          ],
        },
      ],
    });

    render(<FocusBarChart />);

    await waitFor(() => {
      expect(screen.getByText("Tempo de foco")).toBeInTheDocument();
      expect(screen.getByText("13 Out — 26 Out 2026")).toBeInTheDocument();
      expect(screen.getByText("Dia")).toBeInTheDocument();
      expect(screen.getByText("Sem")).toBeInTheDocument();
      expect(screen.getByText("Mês")).toBeInTheDocument();
      expect(screen.getByText("Ano")).toBeInTheDocument();
      expect(screen.getByText("Estatística UFG")).toBeInTheDocument();
      expect(screen.getByText("Sem matéria")).toBeInTheDocument();
    });
  });

  it("switches period when button is clicked", async () => {
    vi.mocked(statsApi.getFocusBars).mockResolvedValue({
      period: "week",
      offset: 0,
      range_label: "Semana 43",
      start_date: "2026-10-19",
      end_date: "2026-10-25",
      total_study_seconds: 0,
      total_pomodoros: 0,
      subjects: [],
      bars: [],
    });

    render(<FocusBarChart />);

    const weekButton = screen.getByText("Sem");
    fireEvent.click(weekButton);

    await waitFor(() => {
      expect(statsApi.getFocusBars).toHaveBeenCalledWith(
        "http://localhost:9823",
        "week",
        0,
        undefined
      );
    });
  });
});
