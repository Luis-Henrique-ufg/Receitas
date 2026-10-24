import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CommandPalette from "@/components/search/command-palette";
import { BrowserRouter } from "react-router-dom";
import { searchApi } from "@/services/searchApi";

vi.mock("@/services/searchApi", () => ({
  searchApi: {
    search: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <BrowserRouter>
        <CommandPalette isOpen={false} onClose={vi.fn()} />
      </BrowserRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders quick actions when open and searches on input", async () => {
    vi.mocked(searchApi.search).mockResolvedValueOnce({
      courses: [{ id: 1, name: "Python Fundamentos" }],
      lessons: [{ id: 10, title: "Funções e Loops", course_id: 1, is_completed: false }],
      notes: [],
      attachments: [],
    });

    render(
      <BrowserRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Buscar cursos, aulas/i)).toBeInTheDocument();
    expect(screen.getByText("Alternar Modo Zen")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Buscar cursos, aulas/i);
    fireEvent.change(input, { target: { value: "Python" } });

    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalledWith("http://localhost:9823", "Python");
      expect(screen.getByText("Python Fundamentos")).toBeInTheDocument();
      expect(screen.getByText("Funções e Loops")).toBeInTheDocument();
    });
  });
});
