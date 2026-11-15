import { Download, FileCode, FileText, FileArchive, File } from "lucide-react";
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

const renderFileIcon = (ext: string) => {
  if (["html", "htm", "js", "ts", "jsx", "tsx", "py", "c", "cpp", "java", "json"].includes(ext)) {
    return <FileCode className="w-5 h-5 text-primary shrink-0" />;
  }
  if (["pdf", "txt", "doc", "docx", "md"].includes(ext)) {
    return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-accent shrink-0" />;
  }
  return <File className="w-5 h-5 text-primary shrink-0" />;
};

export default function LessonAttachments({
  attachments,
  isLoading,
  apiUrl,
}: Props) {
  if (isLoading) {
    return (
      <div className="p-6 border rounded-2xl border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-secondary/40 space-y-2">
        <p className="text-xs font-medium">Carregando materiais e anexos...</p>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="p-6 border rounded-2xl border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-secondary/35 space-y-2 text-center">
        <FileText className="w-7 h-7 text-muted-foreground/60" />
        <p className="text-xs font-medium">Nenhum material complementar para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {attachments.map((file, i) => {
        const ext = getFileExtension(file.name);
        const fileUrl = `${apiUrl}/serve-content?path=${encodeURIComponent(file.path)}`;

        return (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 bg-secondary/40 hover:bg-secondary/75 rounded-2xl border border-border transition-all duration-200 gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {renderFileIcon(ext)}
              <span className="text-foreground font-medium text-[13px] truncate" title={file.name}>
                {file.name}
              </span>
              {ext && (
                <span className="bg-card border border-border text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold tracking-wider shrink-0">
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
                <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs font-semibold bg-card hover:bg-primary text-foreground hover:text-[#030607] border border-border hover:border-primary rounded-xl">
                  <Download className="w-3.5 h-3.5 text-current" />
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
