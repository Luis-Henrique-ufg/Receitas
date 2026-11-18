import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SessionsDialog from "@/components/stats/sessions-dialog";
import { pomodoroApi } from "@/services/pomodoroApi";

vi.mock("@/services/pomodoroApi", () => ({
  pomodoroApi: {
    getSessions: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
}));

describe("SessionsDialog component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sessions list and allows deleting a session", async () => {
    const mockSessions = [
      {
        id: 33,
        date: "2026-11-18",
        start_time: "15:04",
        end_time: "10:02",
        duration_seconds: 68272,
        pomodoros: 45,
        subject_id: 1,
        subject_name: "Estatística e Probabilidade",
        subject_color: "#FF7020",
        intention: "Estudar para prova",
        course_id: null,
        course_name: null,
        created_at: "2026-11-18T13:00:00",
      },
    ];

    vi.mocked(pomodoroApi.getSessions).mockResolvedValueOnce(mockSessions);
    vi.mocked(pomodoroApi.deleteSession).mockResolvedValueOnce();

    const onSessionDeleted = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <SessionsDialog
        open={true}
        onOpenChange={onOpenChange}
        dateStr="2026-11-18"
        dateLabel="18 Nov (Qua)"
        onSessionDeleted={onSessionDeleted}
      />
    );

    // Wait for session to appear
    await waitFor(() => {
      expect(screen.getByText("Estatística e Probabilidade")).toBeInTheDocument();
      expect(screen.getByText("18h 57m")).toBeInTheDocument();
      expect(screen.getAllByText(/45 pomodoros/)[0]).toBeInTheDocument();
    });

    // Find and click the trash button to confirm
    const deleteButton = screen.getByTitle("Excluir esta sessão e descontar do gráfico");
    fireEvent.click(deleteButton);

    // Now confirmation button "Excluir" appears
    const confirmButton = screen.getByRole("button", { name: "Excluir" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(pomodoroApi.deleteSession).toHaveBeenCalledWith("http://localhost:9823", 33);
      expect(onSessionDeleted).toHaveBeenCalled();
    });
  });

  it("shows empty state when no sessions exist", async () => {
    vi.mocked(pomodoroApi.getSessions).mockResolvedValueOnce([]);

    render(
      <SessionsDialog
        open={true}
        onOpenChange={vi.fn()}
        dateStr="2026-11-18"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma sessão de foco encontrada para esta data.")
      ).toBeInTheDocument();
    });
  });
});
