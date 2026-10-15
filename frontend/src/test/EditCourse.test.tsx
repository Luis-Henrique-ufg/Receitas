import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EditCourse from "@/components/courses/edit-course";
import { Course } from "@/models/models";

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
});
