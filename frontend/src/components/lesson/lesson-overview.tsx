import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Edit2, Save, X } from "lucide-react";
import { Lesson } from "@/hooks/useCoursePlayer";

type Props = {
  lesson: Lesson;
};

export default function LessonOverview({ lesson }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(lesson.description || "Bem-vindo(a) a esta aula! Assista ao conteúdo e aproveite o material.");

  // Sync when lesson changes
  useEffect(() => {
    setContent(lesson.description || "Bem-vindo(a) a esta aula! Assista ao conteúdo e aproveite o material.");
    setIsEditing(false);
  }, [lesson]);

  const handleSave = () => {
    // Para já, vamos salvar apenas no estado local.
    // Numa versão futura, integrar com a API.
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(lesson.description || "Bem-vindo(a) a esta aula! Assista ao conteúdo e aproveite o material.");
    setIsEditing(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <h3 className="font-heading text-lg font-medium text-white">Sobre a Aula</h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-white/5 text-sm text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#007bff]/20 text-[#007bff] hover:bg-[#007bff]/30 border border-[#007bff]/30 text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        )}
      </div>

      <div className="text-white/80 w-full min-w-0">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[400px] bg-black/20 border border-white/10 rounded-md p-4 text-white placeholder-white/30 focus:outline-none focus:border-[#007bff]/50 resize-y custom-scrollbar"
            placeholder="Escreva algo em markdown..."
          />
        ) : (
          <div className="prose prose-invert prose-blue max-w-none 
            prose-headings:font-heading prose-headings:font-medium prose-headings:text-white
            prose-p:leading-relaxed prose-a:text-[#007bff] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
