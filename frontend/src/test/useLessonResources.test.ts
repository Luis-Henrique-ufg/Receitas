import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useLessonResources from "@/hooks/useLessonResources";
import { lessonsApi } from "@/services/lessonsApi";
import { toast } from "sonner";

vi.mock("@/services/lessonsApi", () => ({
  lessonsApi: {
    getLessonNotes: vi.fn(),
    getCourseNotes: vi.fn(),
    getAttachments: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:5000" }),
}));

describe("useLessonResources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads notes successfully even when there are no notes for the lesson", async () => {
    vi.mocked(lessonsApi.getLessonNotes).mockResolvedValueOnce([]);
    vi.mocked(lessonsApi.getAttachments).mockResolvedValueOnce([]);
    vi.mocked(lessonsApi.getCourseNotes).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLessonResources(1, 10));

    await waitFor(() => {
      expect(result.current.isNotesLoading).toBe(false);
    });

    expect(lessonsApi.getLessonNotes).toHaveBeenCalledWith(
      "http://localhost:5000",
      1
    );
    expect(result.current.notes).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("handles fetch failure by showing toast error", async () => {
    vi.mocked(lessonsApi.getLessonNotes).mockRejectedValueOnce(
      new Error("Network Error")
    );
    vi.mocked(lessonsApi.getAttachments).mockResolvedValueOnce([]);
    vi.mocked(lessonsApi.getCourseNotes).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLessonResources(2, 10));

    await waitFor(() => {
      expect(result.current.isNotesLoading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith("Erro ao carregar anotações da aula.");
    expect(result.current.notes).toEqual([]);
  });
});
