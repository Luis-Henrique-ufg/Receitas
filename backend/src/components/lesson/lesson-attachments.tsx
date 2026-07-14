import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonAttachment } from "@/hooks/useLessonResources";

type Props = {
  attachments: LessonAttachment[];
  isLoading?: boolean;
  apiUrl: string;
};

export default function LessonAttachments({
  attachments,
  isLoading,
  apiUrl,
}: Props) {
  if (isLoading) {
    return (
      <div className="p-4 border rounded-md border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 bg-white/5">
        <p>Carregando anexos...</p>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="p-4 border rounded-md border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 bg-white/5">
        <p>Nenhum anexo disponível para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((file, i) => (
        <div key={i} className="flex items-center justify-between p-3 glass-panel rounded-lg hover:bg-white/10 transition-colors duration-300">
          <span className="text-white/80 font-medium truncate flex-1 mr-4">{file.name}</span>
          <a
            href={`${apiUrl}/serve-content?path=${encodeURIComponent(file.path)}`}
            target="_blank"
            download
          >
            <Button size="sm" variant="outline" className="gap-2">
              <DownloadIcon className="w-4 h-4" /> Baixar
            </Button>
          </a>
        </div>
      ))}
    </div>
  );
}
