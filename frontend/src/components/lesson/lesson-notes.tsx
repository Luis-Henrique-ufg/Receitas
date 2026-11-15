import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Clock,
  Trash2,
  Search,
  Film,
  BookOpen,
  Pencil,
  Check,
  X,
  Download,
  FileText,
  FileCode,
} from "lucide-react";
import { LessonNote, CourseNote } from "@/hooks/useLessonResources";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  notes: LessonNote[];
  courseNotes?: CourseNote[];
  currentLessonId?: number;
  courseTitle?: string;
  lessonTitle?: string;
  newNote: string;
  isLoading?: boolean;
  isCourseNotesLoading?: boolean;
  onNewNoteChange: (value: string) => void;
  onSave: () => void;
  onEdit: (noteId: number, content: string) => void;
  onDelete: (noteId: number) => void;
  onSeek: (time: number) => void;
  onSelectLessonAndSeek?: (lessonId: number, time: number) => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function generateMarkdown(
  title: string,
  notesList: (LessonNote | CourseNote)[],
  isGlobal: boolean
): string {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let md = `# Anotações: ${title}\n\n`;
  md += `> **Data de Exportação:** ${dateStr}  \n`;
  md += `> **Total de Anotações:** ${notesList.length}\n\n`;
  md += `---\n\n`;

  if (isGlobal) {
    const grouped: Record<string, CourseNote[]> = {};
    (notesList as CourseNote[]).forEach((note) => {
      const key = `${note.module ? note.module + " > " : ""}${note.lesson_title}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(note);
    });

    Object.entries(grouped).forEach(([lessonName, items]) => {
      md += `## 📚 ${lessonName}\n\n`;
      items.forEach((item) => {
        md += `### ⏱ \`${formatTime(item.time)}\`\n\n`;
        md += `${item.content}\n\n`;
      });
      md += `---\n\n`;
    });
  } else {
    notesList.forEach((note) => {
      md += `### ⏱ \`${formatTime(note.time)}\`\n\n`;
      md += `${note.content}\n\n`;
      md += `---\n\n`;
    });
  }

  return md;
}

function generatePlainText(
  title: string,
  notesList: (LessonNote | CourseNote)[],
  isGlobal: boolean
): string {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const separator = "=".repeat(80);
  const subSeparator = "-".repeat(80);

  let txt = `${separator}\n`;
  txt += `ANOTAÇÕES: ${title.toUpperCase()}\n`;
  txt += `Exportado em: ${dateStr}\n`;
  txt += `Total de Anotações: ${notesList.length}\n`;
  txt += `${separator}\n\n`;

  if (isGlobal) {
    const grouped: Record<string, CourseNote[]> = {};
    (notesList as CourseNote[]).forEach((note) => {
      const key = `${note.module ? note.module + " > " : ""}${note.lesson_title}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(note);
    });

    Object.entries(grouped).forEach(([lessonName, items]) => {
      txt += `[AULA: ${lessonName}]\n`;
      txt += `${subSeparator}\n\n`;
      items.forEach((item) => {
        txt += `Tempo: [${formatTime(item.time)}]\n`;
        txt += `${item.content}\n\n`;
      });
      txt += `\n`;
    });
  } else {
    notesList.forEach((note) => {
      txt += `Tempo: [${formatTime(note.time)}]\n`;
      txt += `${note.content}\n\n`;
      txt += `${subSeparator}\n\n`;
    });
  }

  return txt;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Download iniciado: ${filename}`);
}

export default function LessonNotes({
  notes,
  courseNotes = [],
  currentLessonId,
  courseTitle = "Curso",
  lessonTitle = "Aula",
  newNote,
  isLoading,
  isCourseNotesLoading,
  onNewNoteChange,
  onSave,
  onEdit,
  onDelete,
  onSeek,
  onSelectLessonAndSeek,
}: Props) {
  const [viewMode, setViewMode] = useState<"lesson" | "course">("lesson");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSavedState, setShowSavedState] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportScope, setExportScope] = useState<"course" | "lesson">("course");
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleToggleExportMenu = () => {
    if (!showExportMenu) {
      setExportScope(viewMode);
    }
    setShowExportMenu(!showExportMenu);
  };

  const handleSave = () => {
    onSave();
    setShowSavedState(true);
    setTimeout(() => setShowSavedState(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleStartEdit = (note: LessonNote | CourseNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent("");
  };

  const handleSaveEdit = (noteId: number) => {
    if (editingContent.trim()) {
      onEdit(noteId, editingContent);
    }
    setEditingNoteId(null);
    setEditingContent("");
  };

  const handleExport = (scope: "course" | "lesson", format: "md" | "txt") => {
    const isGlobal = scope === "course";
    const targetNotes = isGlobal ? courseNotes : notes;
    const targetTitle = isGlobal ? courseTitle : `${courseTitle} - ${lessonTitle}`;

    if (targetNotes.length === 0) {
      toast.info("Não há anotações para exportar.");
      return;
    }

    const safeTitle = targetTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();

    const filename = `${safeTitle}_anotacoes.${format}`;

    if (format === "md") {
      const content = generateMarkdown(targetTitle, targetNotes, isGlobal);
      downloadFile(content, filename, "text/markdown");
    } else {
      const content = generatePlainText(targetTitle, targetNotes, isGlobal);
      downloadFile(content, filename, "text/plain");
    }
  };

  // Filtered course notes based on search query
  const filteredCourseNotes = useMemo(() => {
    if (!searchQuery.trim()) return courseNotes;
    const q = searchQuery.toLowerCase();
    return courseNotes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        n.lesson_title.toLowerCase().includes(q) ||
        (n.module && n.module.toLowerCase().includes(q))
    );
  }, [courseNotes, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Action Bar: View Switcher + Export Button */}
      <div className="flex items-center gap-2">
        {/* View Switcher: Esta Aula vs Todo o Curso */}
        <div className="flex flex-1 bg-secondary/80 p-1 rounded-xl border border-border gap-1">
          <button
            type="button"
            onClick={() => {
              setViewMode("lesson");
              handleCancelEdit();
            }}
            className={cn(
              "flex-1 py-1.5 px-2.5 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              viewMode === "lesson"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Film className="w-3.5 h-3.5 text-primary" />
            <span>Esta Aula ({notes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("course");
              handleCancelEdit();
            }}
            className={cn(
              "flex-1 py-1.5 px-2.5 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              viewMode === "course"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Todo o Curso ({courseNotes.length})</span>
          </button>
        </div>

        {/* Export / Download Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={handleToggleExportMenu}
            className={cn(
              "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer",
              showExportMenu
                ? "bg-primary text-[#030607] border-primary shadow-sm"
                : "bg-secondary/70 text-foreground border-border hover:bg-secondary"
            )}
            title="Baixar anotações (.md ou .txt)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Baixar</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 z-50 p-3.5 rounded-2xl border border-border shadow-2xl bg-card text-foreground space-y-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-display font-semibold text-foreground">Baixar Anotações</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                  {exportScope === "course" ? `${courseNotes.length} no total` : `${notes.length} na aula`}
                </span>
              </div>

              {/* Scope Selector: Todo o Curso vs Esta Aula */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Origem das Anotações
                </label>
                <div className="grid grid-cols-2 gap-1 bg-secondary/70 p-1 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setExportScope("course")}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      exportScope === "course"
                        ? "bg-card text-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <BookOpen className="w-3 h-3 text-primary" />
                    Todo Curso ({courseNotes.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope("lesson")}
                    disabled={notes.length === 0}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      exportScope === "lesson"
                        ? "bg-card text-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                    )}
                  >
                    <Film className="w-3 h-3 text-primary" />
                    Esta Aula ({notes.length})
                  </button>
                </div>
              </div>

              {/* Format Selection Cards */}
              <div className="space-y-1.5 pt-0.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Formato do Arquivo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleExport(exportScope, "md");
                      setShowExportMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/50 transition-all group cursor-pointer text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-1.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Markdown</span>
                    <span className="text-[10px] text-accent font-mono mt-0.5">.md</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleExport(exportScope, "txt");
                      setShowExportMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/50 transition-all group cursor-pointer text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-1.5">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Texto Puro</span>
                    <span className="text-[10px] text-primary font-mono mt-0.5">.txt</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === "lesson" ? (
        /* ================= ESTA AULA ================= */
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Escreva uma anotação no segundo atual da aula... (Ctrl+Enter para salvar)"
              className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground min-h-24 rounded-xl focus-visible:ring-primary"
              value={newNote}
              onChange={(e) => onNewNoteChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end items-center gap-3">
              <span
                className={`text-accent text-xs font-semibold transition-opacity duration-300 ${
                  showSavedState ? "opacity-100" : "opacity-0"
                }`}
              >
                Salvo!
              </span>
              <Button
                onClick={handleSave}
                size="sm"
                className="rounded-xl bg-primary text-[#030607] font-semibold hover:brightness-105"
              >
                Salvar Anotação
              </Button>
            </div>
          </div>

          <div className="space-y-3 mt-4 pb-8">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-4 text-xs">
                Carregando anotações da aula...
              </p>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-border rounded-2xl bg-secondary/35">
                <p className="text-foreground/80 font-medium text-xs">
                  Nenhuma anotação nesta aula ainda.
                </p>
                <p className="text-muted-foreground text-[11px] mt-1">
                  Escreva no campo acima para salvar um ponto importante.
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-secondary/40 hover:bg-secondary/65 p-3.5 rounded-2xl group border border-border transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <button
                      onClick={() => onSeek(note.time)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full hover:bg-primary hover:text-[#030607] transition-all cursor-pointer"
                      title="Ir para este momento no vídeo"
                    >
                      <Clock className="w-3 h-3" /> {formatTime(note.time)}
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {editingNoteId !== note.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(note)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-card cursor-pointer"
                          title="Editar anotação"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors p-1 rounded hover:bg-card cursor-pointer"
                        title="Excluir anotação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingNoteId === note.id ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSaveEdit(note.id);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelEdit();
                          }
                        }}
                        className="bg-card border-border text-foreground text-sm min-h-20 rounded-xl focus-visible:ring-primary"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-3 py-1 text-xs font-semibold bg-primary text-[#030607] hover:brightness-105 rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground text-[13.5px] whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ================= TODO O CURSO ================= */
        <div className="space-y-3">
          {/* Campo de Busca Global */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar em todas as anotações do curso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>

          <div className="space-y-3 mt-3 pb-8">
            {isCourseNotesLoading ? (
              <p className="text-muted-foreground text-center py-6 text-xs">
                Carregando todas as anotações do curso...
              </p>
            ) : filteredCourseNotes.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-border rounded-2xl bg-secondary/35">
                <p className="text-muted-foreground text-xs">
                  {searchQuery.trim()
                    ? "Nenhuma anotação encontrada para essa busca."
                    : "Nenhuma anotação cadastrada no curso ainda."}
                </p>
              </div>
            ) : (
              filteredCourseNotes.map((note) => {
                const isCurrent = currentLessonId === note.lesson_id;
                return (
                  <div
                    key={note.id}
                    className={cn(
                      "p-3.5 rounded-2xl group border transition-colors",
                      isCurrent
                        ? "border-primary/40 bg-primary/8"
                        : "border-border bg-secondary/40 hover:bg-secondary/65"
                    )}
                  >
                    {/* Header do Card: Aula + Timestamp + Ações */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectLessonAndSeek) {
                              onSelectLessonAndSeek(note.lesson_id, note.time);
                            }
                          }}
                          className={cn(
                            "text-left inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-colors truncate max-w-full cursor-pointer",
                            isCurrent
                              ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                              : "bg-card text-foreground border border-border hover:border-primary/40"
                          )}
                          title={`Ir para aula: ${note.lesson_title}`}
                        >
                          <Film className="w-3 h-3 shrink-0 text-primary" />
                          <span className="truncate">{note.lesson_title}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectLessonAndSeek) {
                              onSelectLessonAndSeek(note.lesson_id, note.time);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10.5px] font-mono font-semibold text-primary bg-primary/12 border border-primary/25 px-2 py-0.5 rounded-full hover:bg-primary hover:text-[#030607] transition-all shrink-0 cursor-pointer"
                          title="Pular para o tempo da anotação"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(note.time)}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        {editingNoteId !== note.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(note)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-card cursor-pointer"
                            title="Editar anotação"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(note.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors p-1 rounded hover:bg-card cursor-pointer"
                          title="Excluir anotação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleSaveEdit(note.id);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          }}
                          className="bg-card border-border text-foreground text-sm min-h-20 rounded-xl focus-visible:ring-primary"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(note.id)}
                            className="px-3 py-1 text-xs font-semibold bg-primary text-[#030607] hover:brightness-105 rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground text-[13.5px] whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
