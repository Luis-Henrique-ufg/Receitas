import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Course } from "@/models/models";
import {
  CATEGORY_CONFIGS,
  CreateEventInput,
  EventCategory,
  StudyEvent,
} from "@/models/event";
import { cn } from "@/lib/utils";
import { Trash2, CheckCircle2 } from "lucide-react";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateEventInput) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialDate?: string;
  eventToEdit?: StudyEvent | null;
  courses: Course[];
}

const CATEGORIES: EventCategory[] = ["prova", "entrega", "revisao", "lembrete"];

export default function EventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  eventToEdit,
  courses,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("lembrete");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDate(eventToEdit.date);
      setTime(eventToEdit.time || "");
      setCategory(eventToEdit.category);
      setCourseId(eventToEdit.course_id || null);
      setNotes(eventToEdit.notes || "");
      setDone(eventToEdit.done);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      setTitle("");
      setDate(initialDate || todayStr);
      setTime("");
      setCategory("lembrete");
      setCourseId(null);
      setNotes("");
      setDone(false);
    }
  }, [eventToEdit, initialDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    try {
      setIsSubmitting(true);
      await onSave({
        title: title.trim(),
        date,
        time: time.trim() ? time : null,
        category,
        course_id: courseId,
        notes: notes.trim() ? notes : null,
        done,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit || !onDelete) return;
    if (window.confirm("Deseja realmente excluir este evento?")) {
      try {
        setIsSubmitting(true);
        await onDelete(eventToEdit.id);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="glass-panel border-white/15 bg-zinc-950/90 text-white max-w-lg p-6 sm:rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-white tracking-tight">
            {eventToEdit ? "Editar evento" : "Novo evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs text-zinc-300 font-medium">
              Título
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova de Estatística, Entrega de Trabalho..."
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-blue-500/50"
              required
              autoFocus
            />
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300 font-medium">Categoria</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const conf = CATEGORY_CONFIGS[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all",
                      conf.bgClass,
                      conf.borderClass,
                      conf.textClass,
                      isSelected
                        ? "ring-2 ring-white/40 font-semibold scale-[1.02]"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", conf.dotClass)} />
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date" className="text-xs text-zinc-300 font-medium">
                Data
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time" className="text-xs text-zinc-300 font-medium">
                Horário (opcional)
              </Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Curso relacionado (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="event-course" className="text-xs text-zinc-300 font-medium">
              Curso relacionado (opcional)
            </Label>
            <select
              id="event-course"
              value={courseId ?? ""}
              onChange={(e) =>
                setCourseId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
            >
              <option value="" className="bg-zinc-900 text-zinc-300">
                Nenhum (evento avulso)
              </option>
              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                  className="bg-zinc-900 text-white"
                >
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="event-notes" className="text-xs text-zinc-300 font-medium">
              Notas e observações
            </Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tópicos a revisar, link do formulário, sala da prova..."
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 min-h-[70px] text-xs resize-none"
            />
          </div>

          {/* Status Concluído (quando editando) */}
          {eventToEdit && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDone(!done)}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                  done
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {done ? "Marcado como concluído" : "Marcar como concluído"}
              </button>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-4 border-t border-white/10 sm:justify-between">
            {eventToEdit && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5 h-9 px-3 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs text-zinc-300 h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !title.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9 px-4"
              >
                {eventToEdit ? "Salvar alterações" : "Criar evento"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
