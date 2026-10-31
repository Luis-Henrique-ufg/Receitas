import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditCourse from "@/components/courses/edit-course";
import { Course } from "@/models/models";
import { coursesApi } from "@/services/coursesApi";

vi.mock("@/services/coursesApi", () => ({
  coursesApi: {
    update: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiUrl", () => ({
  default: () => ({ apiUrl: "http://localhost:9823" }),
}));

const mockCourse: Course = {
  id: 1,
  name: "Curso de Teste",
  path: "C:\\Cursos\\Teste",
  isCoverUrl: false,
};

describe("EditCourse Component", () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-image");
  });
  it("renders Edit button and opens dialog with course details", () => {
    const onUpdate = vi.fn();
    render(<EditCourse course={mockCourse} onUpdate={onUpdate} />);

    const editBtn = screen.getByRole("button", { name: "Editar" });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);

    expect(screen.getByText(/Editando - Curso de Teste/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Curso de Teste")).toBeInTheDocument();
    expect(screen.getByDisplayValue("C:\\Cursos\\Teste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
  });

  it("attaches a local image file and submits update with imageFile", async () => {
    const onUpdate = vi.fn();
    vi.mocked(coursesApi.update).mockResolvedValueOnce({
      ...mockCourse,
      name: "Curso de Teste",
      fileCover: "test_uploaded.png",
    });

    render(<EditCourse course={mockCourse} onUpdate={onUpdate} />);

    const editBtn = screen.getByRole("button", { name: "Editar" });
    fireEvent.click(editBtn);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File(["dummy content"], "capa_local.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const confirmBtn = screen.getByRole("button", { name: "Confirmar" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(coursesApi.update).toHaveBeenCalledWith(
        "http://localhost:9823",
        1,
        expect.objectContaining({
          name: "Curso de Teste",
          path: "C:\\Cursos\\Teste",
          imageFile: expect.any(File),
        })
      );
    });
  });
});
