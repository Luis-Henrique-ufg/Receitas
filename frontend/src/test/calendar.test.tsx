import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CalendarMonthGrid from "@/components/calendar/calendar-month-grid";
import UpcomingDeadlines from "@/components/calendar/upcoming-deadlines";
import { StudyEvent } from "@/models/event";
import { Course } from "@/models/models";

const mockCourses: Course[] = [
  {
    id: 1,
    name: "Estatística e Probabilidade",
    path: "/courses/estatistica",
    isCoverUrl: false,
    position: 0,
  },
];

const mockEvents: StudyEvent[] = [
  {
    id: 1,
    title: "Prova 1 - Estatística",
    date: "2026-11-15",
    time: "14:00",
    category: "prova",
    done: false,
    course_id: 1,
  },
  {
    id: 2,
    title: "Entrega Exercícios C",
    date: "2026-11-20",
    category: "entrega",
    done: false,
  },
];

describe("UpcomingDeadlines component", () => {
  it("renders deadlines with category badges and title", () => {
    const onToggleDone = vi.fn();
    const onEdit = vi.fn();
    const onNewEvent = vi.fn();
    const onExportIcs = vi.fn();

    render(
      <UpcomingDeadlines
        events={mockEvents}
        courses={mockCourses}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
        onNewEvent={onNewEvent}
        onExportIcs={onExportIcs}
      />
    );

    expect(screen.getByText("Próximos prazos")).toBeInTheDocument();
    expect(screen.getByText("Prova 1 - Estatística")).toBeInTheDocument();
    expect(screen.getByText("Entrega Exercícios C")).toBeInTheDocument();
    expect(screen.getByText("Estatística e Probabilidade")).toBeInTheDocument();
  });

  it("handles export .ics click", () => {
    const onExportIcs = vi.fn();
    render(
      <UpcomingDeadlines
        events={mockEvents}
        courses={mockCourses}
        onToggleDone={vi.fn()}
        onEdit={vi.fn()}
        onNewEvent={vi.fn()}
        onExportIcs={onExportIcs}
      />
    );

    const exportBtn = screen.getByTitle(/Exportar calendário/i);
    fireEvent.click(exportBtn);
    expect(onExportIcs).toHaveBeenCalled();
  });
});

describe("CalendarMonthGrid component", () => {
  it("renders calendar month grid with weekdays and event chips", () => {
    const onChangeMonth = vi.fn();
    const onSelectDate = vi.fn();
    const onEditEvent = vi.fn();
    const onChangeCategoryFilter = vi.fn();

    render(
      <CalendarMonthGrid
        currentDate={new Date(2026, 10, 1)} // Nov 2026
        onChangeMonth={onChangeMonth}
        events={mockEvents}
        heatmapDays={[{ date: "2026-11-15", study_seconds: 3600, pomodoros: 1, lessons: 1, level: 2 }]}
        categoryFilter="all"
        onChangeCategoryFilter={onChangeCategoryFilter}
        onSelectDate={onSelectDate}
        onEditEvent={onEditEvent}
      />
    );

    expect(screen.getByText("Novembro de 2026")).toBeInTheDocument();
    expect(screen.getByText("Prova 1 - Estatística")).toBeInTheDocument();
    expect(screen.getByText("Entrega Exercícios C")).toBeInTheDocument();

    // Clicking event calls onEditEvent
    fireEvent.click(screen.getByText("Prova 1 - Estatística"));
    expect(onEditEvent).toHaveBeenCalledWith(mockEvents[0]);
  });
});
