import { Download, ExternalLink, FileCode, FileText, FileArchive, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonAttachment } from "@/hooks/useLessonResources";

type Props = {
  attachments: LessonAttachment[];
  isLoading?: boolean;
  apiUrl: string;
};

const getFileExtension = (filename: string) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

const isViewableInBrowser = (ext: string) => {
  return ["html", "htm", "pdf", "txt", "json", "md", "png", "jpg", "jpeg", "svg"].includes(ext);
};

const renderFileIcon = (ext: string) => {
  if (["html", "htm", "js", "ts", "jsx", "tsx", "py", "c", "cpp", "java", "json"].includes(ext)) {
    return <FileCode className="w-5 h-5 text-amber-400 shrink-0" />;
  }
  if (["pdf", "txt", "doc", "docx", "md"].includes(ext)) {
    return <FileText className="w-5 h-5 text-rose-400 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-emerald-400 shrink-0" />;
  }
  return <File className="w-5 h-5 text-sky-400 shrink-0" />;
};

export default function LessonAttachments({
  attachments,
  isLoading,
  apiUrl,
}: Props) {
  if (isLoading) {
    return (
      <div className="p-6 border rounded-xl border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 bg-white/5 space-y-2">
        <p className="text-sm">Carregando materiais e anexos...</p>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="p-6 border rounded-xl border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 bg-white/5 space-y-2">
        <FileText className="w-8 h-8 opacity-40 text-white" />
        <p className="text-sm">Nenhum material ou anexo disponível para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((file, i) => {
        const ext = getFileExtension(file.name);
        const canPreview = isViewableInBrowser(ext);
        const fileUrl = `${apiUrl}/serve-content?path=${encodeURIComponent(file.path)}`;

        return (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 glass-panel glass-panel-interactive rounded-xl hover:bg-white/10 border border-white/10 transition-all duration-300 gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {renderFileIcon(ext)}
              <span className="text-white/90 font-medium text-sm truncate" title={file.name}>
                {file.name}
              </span>
              {ext && (
                <span className="bg-white/10 border border-white/15 text-white/70 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider shrink-0">
                  {ext}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                title="Baixar arquivo"
              >
                <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs font-medium bg-white/10 hover:bg-white/20 text-white border-none">
                  <Download className="w-3.5 h-3.5 text-[#007bff]" />
                  Baixar
                </Button>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
