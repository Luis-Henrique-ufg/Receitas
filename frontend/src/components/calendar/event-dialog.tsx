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
import { Course, Subject } from "@/models/models";
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
  courses?: Course[];
  subjects?: Subject[];
}

const CATEGORIES: EventCategory[] = ["prova", "entrega", "revisao", "lembrete"];

export default function EventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  eventToEdit,
  courses: _courses = [],
  subjects = [],
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("lembrete");
  const [subjectId, setSubjectId] = useState<number | null>(null);
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
      setSubjectId(eventToEdit.subject_id ?? null);
      setCourseId(eventToEdit.course_id ?? null);
      setNotes(eventToEdit.notes || "");
      setDone(eventToEdit.done);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      setTitle("");
      setDate(initialDate || todayStr);
      setTime("");
      setCategory("lembrete");
      setSubjectId(null);
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
        subject_id: subjectId,
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
        className="bg-card border border-border text-foreground max-w-lg p-6 sm:rounded-3xl shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-semibold text-foreground tracking-tight">
            {eventToEdit ? "Editar evento" : "Novo evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs text-muted-foreground font-medium">
              Título
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova de Estatística, Entrega de Trabalho..."
              className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary"
              required
              autoFocus
            />
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Categoria</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const conf = CATEGORY_CONFIGS[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: conf.solidBg,
                            color: conf.solidText,
                            borderColor: conf.solidBg,
                          }
                        : undefined
                    }
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer relative select-none",
                      isSelected
                        ? "font-semibold shadow-sm"
                        : "bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/70 hover:border-border"
                    )}
                  >
                    {!isSelected && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: conf.color }}
                      />
                    )}
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date" className="text-xs text-muted-foreground font-medium">
                Data
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary/50 border-border text-foreground rounded-xl focus:border-primary dark:[color-scheme:dark]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time" className="text-xs text-muted-foreground font-medium">
                Horário (opcional)
              </Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-secondary/50 border-border text-foreground rounded-xl focus:border-primary dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Matéria relacionada (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="event-subject" className="text-xs text-muted-foreground font-medium">
              Matéria relacionada (opcional)
            </Label>
            <select
              id="event-subject"
              value={subjectId ?? ""}
              onChange={(e) =>
                setSubjectId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="" className="bg-card text-muted-foreground">
                Nenhuma (evento avulso)
              </option>
              {subjects
                .filter((s) => !s.is_archived)
                .map((subj) => (
                  <option
                    key={subj.id}
                    value={subj.id}
                    className="bg-card text-foreground"
                  >
                    {subj.name} {subj.code ? `(${subj.code})` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="event-notes" className="text-xs text-muted-foreground font-medium">
              Notas e observações
            </Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tópicos a revisar, link do formulário, sala da prova..."
              className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground min-h-[70px] text-xs rounded-xl resize-none focus:border-primary"
            />
          </div>

          {/* Status Concluído (quando editando) */}
          {eventToEdit && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDone(!done)}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors cursor-pointer",
                  done
                    ? "bg-accent/15 border-accent/35 text-[#007A72] dark:text-[#33C7BC]"
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {done ? "Marcado como concluído" : "Marcar como concluído"}
              </button>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-4 border-t border-border sm:justify-between">
            {eventToEdit && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 h-9 px-3 text-xs rounded-xl"
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
                className="bg-secondary/50 border-border hover:bg-secondary text-xs text-foreground h-9 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !title.trim()}
                className="bg-primary hover:brightness-105 text-[#030607] font-semibold text-xs h-9 px-4 rounded-xl shadow-[0_4px_14px_rgba(255,112,32,0.3)]"
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
