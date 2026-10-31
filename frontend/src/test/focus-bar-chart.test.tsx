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
    localStorage.clear();
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

  it("toggles goal and average lines on and off", async () => {
    vi.mocked(statsApi.getFocusBars).mockResolvedValue({
      period: "day",
      offset: 0,
      range_label: "Hoje",
      start_date: "2026-10-26",
      end_date: "2026-10-26",
      total_study_seconds: 3600,
      total_pomodoros: 1,
      subjects: [],
      bars: [
        {
          key: "2026-10-26",
          label: "26 Out",
          sublabel: "Seg",
          start_date: "2026-10-26",
          end_date: "2026-10-26",
          total_seconds: 3600,
          total_pomodoros: 1,
          breakdown: [
            {
              subject_id: 1,
              name: "Estatística UFG",
              color: "#f59e0b",
              seconds: 3600,
              pomodoros: 1,
            },
          ],
        },
      ],
    });

    render(<FocusBarChart />);

    await waitFor(() => {
      expect(screen.getByText("Meta: 2h")).toBeInTheDocument();
      expect(screen.getByText("Média: 1h")).toBeInTheDocument();
    });

    // Toggle Goal Line off
    const toggleGoalBtn = screen.getByTitle("Ocultar linha de meta");
    fireEvent.click(toggleGoalBtn);
    expect(screen.queryByText("Meta: 2h")).not.toBeInTheDocument();

    // Toggle Goal Line back on
    const showGoalBtn = screen.getByTitle("Exibir linha de meta");
    fireEvent.click(showGoalBtn);
    expect(screen.getByText("Meta: 2h")).toBeInTheDocument();

    // Toggle Average Line off
    const toggleAvgBtn = screen.getByTitle("Ocultar linha de média");
    fireEvent.click(toggleAvgBtn);
    expect(screen.queryByText("Média: 1h")).not.toBeInTheDocument();

    // Toggle Average Line back on
    const showAvgBtn = screen.getByTitle("Exibir linha de média");
    fireEvent.click(showAvgBtn);
    expect(screen.getByText("Média: 1h")).toBeInTheDocument();
  });

  it("opens goal edit dialog and updates goal value", async () => {
    vi.mocked(statsApi.getFocusBars).mockResolvedValue({
      period: "day",
      offset: 0,
      range_label: "Hoje",
      start_date: "2026-10-26",
      end_date: "2026-10-26",
      total_study_seconds: 3600,
      total_pomodoros: 1,
      subjects: [],
      bars: [
        {
          key: "2026-10-26",
          label: "26 Out",
          sublabel: "Seg",
          start_date: "2026-10-26",
          end_date: "2026-10-26",
          total_seconds: 3600,
          total_pomodoros: 1,
          breakdown: [
            {
              subject_id: 1,
              name: "Estatística UFG",
              color: "#f59e0b",
              seconds: 3600,
              pomodoros: 1,
            },
          ],
        },
      ],
    });

    render(<FocusBarChart />);

    await waitFor(() => {
      expect(screen.getByText("Meta: 2h")).toBeInTheDocument();
    });

    // Click edit pencil button
    const editBtn = screen.getByLabelText("Editar meta de estudo");
    fireEvent.click(editBtn);

    // Dialog should open
    expect(screen.getByText(/Editar Meta de Estudo/i)).toBeInTheDocument();

    // Select 4h preset
    const preset4h = screen.getByText("4h");
    fireEvent.click(preset4h);

    // Save
    const saveBtn = screen.getByText("Salvar");
    fireEvent.click(saveBtn);

    // Dialog closes and new goal is displayed
    await waitFor(() => {
      expect(screen.getByText("Meta: 4h")).toBeInTheDocument();
    });

    // Verify localStorage persistence
    const savedGoals = JSON.parse(localStorage.getItem("receitas_focus_goals") || "{}");
    expect(savedGoals.day).toBe(4 * 3600);
  });
});
