import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("renders metrics and streak after loading stats", async () => {
    vi.mocked(statsApi.getHeatmap).mockResolvedValueOnce({
      current_streak: 5,
      max_streak: 12,
      total_seconds: 7200,
      total_pomodoros: 4,
      total_lessons: 6,
      days: [
        { date: "2026-10-20", study_seconds: 1800, pomodoros: 1, lessons: 1, level: 2 },
        { date: "2026-10-21", study_seconds: 1800, pomodoros: 1, lessons: 1, level: 2 },
      ],
    });

    render(<ActivityHeatmap />);

    await waitFor(() => {
      expect(screen.getByText("5 dias")).toBeInTheDocument();
      expect(screen.getByText("12 dias")).toBeInTheDocument();
      expect(screen.getByText("2h 0m")).toBeInTheDocument();
      expect(screen.getByText("4 🍅")).toBeInTheDocument();
    });
  });
});
