import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Film,
  Paperclip,
  FileText,
  Sparkles,
  Timer,
  Moon,
  Sun,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { searchApi, SearchResults } from "@/services/searchApi";
import useApiUrl from "@/hooks/useApiUrl";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    courses: [],
    lessons: [],
    notes: [],
    attachments: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { apiUrl } = useApiUrl();
  const navigate = useNavigate();
  const toggleZenMode = usePlaybackStore((state) => state.toggleZenMode);
  const togglePomodoro = usePomodoroStore((state) => state.toggle);
  const pomodoroRunning = usePomodoroStore((state) => state.isRunning);
  const { theme, setTheme } = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], lessons: [], notes: [], attachments: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchApi.search(apiUrl, query);
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, apiUrl]);

  // System quick actions
  const quickActions = [
    {
      id: "action-zen",
      type: "action" as const,
      title: "Alternar Modo Zen",
      subtitle: "Foco total na visualização de vídeo",
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      action: () => toggleZenMode(),
    },
    {
      id: "action-pomodoro",
      type: "action" as const,
      title: pomodoroRunning ? "Pausar Pomodoro" : "Iniciar Pomodoro",
      subtitle: pomodoroRunning ? "Pausar ciclo atual" : "Iniciar ciclo de 25 minutos",
      icon: <Timer className="w-4 h-4 text-rose-400" />,
      action: () => togglePomodoro(),
    },
    {
      id: "action-theme",
      type: "action" as const,
      title: "Alternar Tema",
      subtitle: `Atualmente: ${theme === "dark" ? "Escuro" : "Claro"}`,
      icon: theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
  ].filter((a) => !query || a.title.toLowerCase().includes(query.toLowerCase()));

  // Flatten searchable list for keyboard navigation
  const flatItems: Array<{
    id: string;
    type: "action" | "course" | "lesson" | "attachment" | "note";
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    onSelect: () => void;
  }> = [
    ...quickActions.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      subtitle: a.subtitle,
      icon: a.icon,
      onSelect: () => {
        a.action();
        onClose();
      },
    })),
    ...results.courses.map((c) => ({
      id: `course-${c.id}`,
      type: "course" as const,
      title: c.name,
      subtitle: "Curso",
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      onSelect: () => {
        navigate(`/receitas/${c.id}`);
        onClose();
      },
    })),
    ...results.lessons.map((l) => ({
      id: `lesson-${l.id}`,
      type: "lesson" as const,
      title: l.title,
      subtitle: `${l.course_name || "Curso"} • ${l.module || ""}`,
      icon: <Film className="w-4 h-4 text-purple-400" />,
      onSelect: () => {
        navigate(`/receitas/${l.course_id}?tab=videos`);
        onClose();
      },
    })),
    ...results.attachments.map((att, i) => ({
      id: `attachment-${i}`,
      type: "attachment" as const,
      title: att.name,
      subtitle: `${att.course_name || ""} > ${att.lesson_title || "Aula"}`,
      icon: <Paperclip className="w-4 h-4 text-emerald-400" />,
      onSelect: () => {
        window.open(`${apiUrl}/serve-content?path=${encodeURIComponent(att.path)}`, "_blank");
        onClose();
      },
    })),
    ...results.notes.map((n) => ({
      id: `note-${n.id}`,
      type: "note" as const,
      title: n.content,
      subtitle: `${n.lesson_title || "Aula"} • ${Math.floor(n.time / 60)}:${(n.time % 60).toString().padStart(2, "0")}`,
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      onSelect: () => {
        if (n.course_id) {
          navigate(`/receitas/${n.course_id}?tab=notes`);
        }
        onClose();
      },
    })),
  ];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, flatItems.length - 1)));
      } else if (e.key === "Enter" && flatItems[selectedIndex]) {
        e.preventDefault();
        flatItems[selectedIndex].onSelect();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-panel rounded-2xl border border-white/20 shadow-2xl overflow-hidden bg-[#050a14]/90 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cursos, aulas, anexos, anotações ou ações..."
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm outline-none font-medium"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/10">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[420px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {flatItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              {query ? "Nenhum resultado encontrado para a busca." : "Digite para buscar cursos, aulas ou ações..."}
            </div>
          ) : (
            flatItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150",
                    isSelected
                      ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-blue-500/40 text-white shadow-sm"
                      : "text-zinc-300 hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-zinc-400 truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 text-zinc-400 shrink-0 transition-opacity",
                      isSelected ? "opacity-100 text-blue-400" : "opacity-0"
                    )}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">↑↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">Enter</kbd> Selecionar
            </span>
          </div>
          <span>Receitas Search</span>
        </div>
      </div>
    </div>
  );
}
