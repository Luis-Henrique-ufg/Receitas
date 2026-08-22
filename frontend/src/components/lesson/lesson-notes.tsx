import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";
import { LessonNote } from "@/hooks/useLessonResources";

type Props = {
  notes: LessonNote[];
  newNote: string;
  isLoading?: boolean;
  onNewNoteChange: (value: string) => void;
  onSave: () => void;
  onDelete: (noteId: number) => void;
  onSeek: (time: number) => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function LessonNotes({
  notes,
  newNote,
  isLoading,
  onNewNoteChange,
  onSave,
  onDelete,
  onSeek,
}: Props) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Textarea 
          placeholder="Digite sua anotação aqui… O tempo do vídeo será registrado automaticamente. Pressione ⌘/⌃+Enter para salvar." 
          className="bg-white/5 border-white/10 text-white min-h-24 focus-visible:ring-[#007bff]"
          value={newNote}
          onChange={e => onNewNoteChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end items-center gap-3">
          <span className={`text-emerald-400 text-xs font-medium transition-opacity duration-300 ${showSavedState ? 'opacity-100' : 'opacity-0'}`}>Salvo!</span>
          <Button onClick={handleSave} size="sm">Salvar Anotação</Button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {isLoading ? (
          <p className="text-white/50 text-center py-4">Carregando anotações...</p>
        ) : notes.length === 0 ? (
          <p className="text-white/50 text-center py-4">Nenhuma anotação para esta aula ainda.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="glass-panel glass-panel-interactive p-3 rounded-lg group">
              <div className="flex justify-between items-start mb-2">
                <button 
                  onClick={() => onSeek(note.time)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-[#007bff]/20 text-[#007bff] px-2 py-1 rounded-md hover:bg-[#007bff]/40 transition-colors"
                >
                  <Clock className="w-3 h-3" /> {formatTime(note.time)}
                </button>
                <button 
                  onClick={() => onDelete(note.id)}
                  className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
