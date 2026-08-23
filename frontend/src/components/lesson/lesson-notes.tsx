import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Clock, Trash2, Search, Film, BookOpen } from "lucide-react";
import { LessonNote, CourseNote } from "@/hooks/useLessonResources";
import { cn } from "@/lib/utils";

type Props = {
  notes: LessonNote[];
  courseNotes?: CourseNote[];
  currentLessonId?: number;
  newNote: string;
  isLoading?: boolean;
  isCourseNotesLoading?: boolean;
  onNewNoteChange: (value: string) => void;
  onSave: () => void;
  onDelete: (noteId: number) => void;
  onSeek: (time: number) => void;
  onSelectLessonAndSeek?: (lessonId: number, time: number) => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function LessonNotes({
  notes,
  courseNotes = [],
  currentLessonId,
  newNote,
  isLoading,
  isCourseNotesLoading,
  onNewNoteChange,
  onSave,
  onDelete,
  onSeek,
  onSelectLessonAndSeek,
}: Props) {
  const [viewMode, setViewMode] = useState<"lesson" | "course">("lesson");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSavedState, setShowSavedState] = useState(false);

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
      {/* View Switcher: Esta Aula vs Todo o Curso */}
      <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/5 gap-1">
        <button
          type="button"
          onClick={() => setViewMode("lesson")}
          className={cn(
            "flex-1 py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5",
            viewMode === "lesson"
              ? "bg-[#007bff] text-white shadow-md shadow-blue-900/30 font-bold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Film className="w-3.5 h-3.5" />
          Esta Aula ({notes.length})
        </button>

        <button
          type="button"
          onClick={() => setViewMode("course")}
          className={cn(
            "flex-1 py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5",
            viewMode === "course"
              ? "bg-[#007bff] text-white shadow-md shadow-blue-900/30 font-bold"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Todo o Curso ({courseNotes.length})
        </button>
      </div>

      {viewMode === "lesson" ? (
        /* ================= ESTA AULA ================= */
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Digite sua anotação aqui… O tempo do vídeo será registrado automaticamente. Pressione ⌘/⌃+Enter para salvar."
              className="bg-white/5 border-white/10 text-white min-h-24 focus-visible:ring-[#007bff]"
              value={newNote}
              onChange={(e) => onNewNoteChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end items-center gap-3">
              <span
                className={`text-emerald-400 text-xs font-medium transition-opacity duration-300 ${
                  showSavedState ? "opacity-100" : "opacity-0"
                }`}
              >
                Salvo!
              </span>
              <Button onClick={handleSave} size="sm">
                Salvar Anotação
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {isLoading ? (
              <p className="text-white/50 text-center py-4 text-xs">
                Carregando anotações da aula...
              </p>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 px-4 border border-white/5 rounded-xl bg-white/[0.02]">
                <p className="text-white/50 text-xs">
                  Nenhuma anotação nesta aula ainda.
                </p>
                <p className="text-white/30 text-[11px] mt-1">
                  Escreva no campo acima para salvar um ponto importante.
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="glass-panel glass-panel-interactive p-3.5 rounded-xl group transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <button
                      onClick={() => onSeek(note.time)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#007bff]/20 text-[#29C5F6] px-2 py-1 rounded-md hover:bg-[#007bff] hover:text-white transition-colors"
                      title="Ir para este momento no vídeo"
                    >
                      <Clock className="w-3 h-3" /> {formatTime(note.time)}
                    </button>
                    <button
                      onClick={() => onDelete(note.id)}
                      className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-all p-1 rounded hover:bg-white/5"
                      title="Excluir anotação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
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
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar em todas as anotações do curso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2.5 mt-3 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
            {isCourseNotesLoading ? (
              <p className="text-white/50 text-center py-6 text-xs">
                Carregando todas as anotações do curso...
              </p>
            ) : filteredCourseNotes.length === 0 ? (
              <div className="text-center py-8 px-4 border border-white/5 rounded-xl bg-white/[0.02]">
                <p className="text-white/50 text-xs">
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
                      "glass-panel glass-panel-interactive p-3.5 rounded-xl group transition-all duration-300 border",
                      isCurrent
                        ? "border-[#007bff]/40 bg-blue-950/10 shadow-[0_0_15px_rgba(0,123,255,0.08)]"
                        : "border-white/10 hover:border-white/20"
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
                            "text-left inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors truncate max-w-full",
                            isCurrent
                              ? "bg-[#007bff]/30 text-white border border-[#007bff]/40"
                              : "bg-white/10 text-white/80 hover:bg-[#007bff] hover:text-white"
                          )}
                          title={`Ir para aula: ${note.lesson_title}`}
                        >
                          <Film className="w-3 h-3 shrink-0" />
                          <span className="truncate">{note.lesson_title}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectLessonAndSeek) {
                              onSelectLessonAndSeek(note.lesson_id, note.time);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-[#007bff]/20 text-[#29C5F6] px-1.5 py-0.5 rounded hover:bg-[#007bff] hover:text-white transition-colors shrink-0"
                          title="Pular para o tempo da anotação"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(note.time)}
                        </button>
                      </div>

                      <button
                        onClick={() => onDelete(note.id)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-all p-1 rounded hover:bg-white/5 shrink-0"
                        title="Excluir anotação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
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
