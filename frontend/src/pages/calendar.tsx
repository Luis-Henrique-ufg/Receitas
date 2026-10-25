import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { Course } from "@/models/models";
import { coursesApi } from "@/services/coursesApi";
import { eventsApi } from "@/services/eventsApi";
import { statsApi, HeatmapDay } from "@/services/statsApi";
import {
  CreateEventInput,
  EventCategory,
  StudyEvent,
} from "@/models/event";
import CalendarMonthGrid from "@/components/calendar/calendar-month-grid";
import UpcomingDeadlines from "@/components/calendar/upcoming-deadlines";
import EventDialog from "@/components/calendar/event-dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Bell } from "lucide-react";

export default function CalendarPage() {
  const { apiUrl } = useApiUrl();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [heatmapDays, setHeatmapDays] = useState<HeatmapDay[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<StudyEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const currentMonthStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [currentDate]);

  // Load courses once
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await coursesApi.getAll(apiUrl);
        setCourses(data);
      } catch (err) {
        console.error("Erro ao carregar cursos:", err);
      }
    }
    loadCourses();
  }, [apiUrl]);

  // Load heatmap days once
  useEffect(() => {
    async function loadHeatmap() {
      try {
        const data = await statsApi.getHeatmap(apiUrl, 180);
        setHeatmapDays(data.days || []);
      } catch (err) {
        console.error("Erro ao carregar heatmap para o calendário:", err);
      }
    }
    loadHeatmap();
  }, [apiUrl]);

  // Load events for the current month view (and upcoming)
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch all events around the current month (or all events)
      const data = await eventsApi.getAll(apiUrl);
      setEvents(data);
    } catch {
      toast.error("Erro ao carregar eventos da agenda.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handlers
  const handleOpenNewDialog = (dateStr?: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(dateStr || todayStr);
    setEventToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (event: StudyEvent) => {
    setEventToEdit(event);
    setSelectedDate(event.date);
    setIsDialogOpen(true);
  };

  const handleSaveEvent = async (input: CreateEventInput) => {
    try {
      if (eventToEdit) {
        await eventsApi.update(apiUrl, eventToEdit.id, input);
        toast.success("Evento atualizado com sucesso!");
      } else {
        await eventsApi.create(apiUrl, input);
        toast.success("Evento criado com sucesso!");
      }
      await fetchEvents();
    } catch (err) {
      toast.error("Erro ao salvar evento.");
      throw err;
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await eventsApi.delete(apiUrl, id);
      toast.success("Evento excluído!");
      await fetchEvents();
    } catch (err) {
      toast.error("Erro ao excluir evento.");
      throw err;
    }
  };

  const handleToggleDone = async (id: number) => {
    try {
      const updated = await eventsApi.toggleDone(apiUrl, id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, done: updated.done } : e))
      );
      toast.success(
        updated.done ? "Evento marcado como concluído!" : "Evento reaberto!"
      );
    } catch {
      toast.error("Erro ao atualizar status do evento.");
    }
  };

  const handleExportIcs = async () => {
    try {
      setIsExporting(true);
      await eventsApi.downloadIcs(apiUrl, { month: currentMonthStr });
      toast.success("Arquivo .ics exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar arquivo .ics.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações.");
      return;
    }

    if (Notification.permission === "granted") {
      toast.info("Lembretes do navegador já estão ativados.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Lembretes ativados! Você receberá avisos no dia dos prazos.");
    } else {
      toast.warning("Permissão de notificação não concedida.");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
                Agenda de Estudos
              </h1>
              <p className="text-xs text-zinc-400">
                Planejamento de provas, entregas e preparação integrada aos cursos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableNotifications}
            className="h-9 px-3 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 gap-1.5"
            title="Ativar lembretes do navegador para os prazos"
          >
            <Bell className="w-3.5 h-3.5 text-zinc-400" />
            <span>Lembretes</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenNewDialog()}
            className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-1.5 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo evento</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Calendar Month on Left (2 cols), Upcoming Deadlines on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <CalendarMonthGrid
            currentDate={currentDate}
            onChangeMonth={setCurrentDate}
            events={events}
            heatmapDays={heatmapDays}
            categoryFilter={categoryFilter}
            onChangeCategoryFilter={setCategoryFilter}
            onSelectDate={handleOpenNewDialog}
            onEditEvent={handleOpenEditDialog}
          />
        </div>

        <div className="lg:col-span-1">
          <UpcomingDeadlines
            events={events}
            courses={courses}
            onToggleDone={handleToggleDone}
            onEdit={handleOpenEditDialog}
            onNewEvent={() => handleOpenNewDialog()}
            onExportIcs={handleExportIcs}
            isExporting={isExporting}
          />
        </div>
      </div>

      {/* Dialog for Create / Edit */}
      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate}
        eventToEdit={eventToEdit}
        courses={courses}
      />
    </div>
  );
}
