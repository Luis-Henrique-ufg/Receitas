import React, { useRef, useState, useEffect } from "react";
import { Course } from "@/models/models";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { coursesApi } from "@/services/coursesApi";
import { X } from "lucide-react";

type Props = {
  course: Course;
  onUpdate: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function EditCourse({
  course,
  onUpdate,
  trigger,
  isOpen: controlledIsOpen,
  onClose,
}: Props) {
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

  const [currentCourse, setCurrentCourse] = useState<Course>(course);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const { apiUrl } = useApiUrl();

  const handleClearFile = () => {
    if (fileInputRefEdit.current) {
      fileInputRefEdit.current.value = "";
    }
    setFilePreview(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClearFile();
      if (isControlled) {
        onClose?.();
      } else {
        setInternalIsOpen(false);
      }
    } else if (!isControlled) {
      setInternalIsOpen(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentCourse(course);
      handleClearFile();
    }
  }, [course, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (typeof URL.createObjectURL === "function") {
        setFilePreview(URL.createObjectURL(file));
      }
      // When attaching a local file, clear urlCover
      setCurrentCourse((prev) => ({
        ...prev,
        urlCover: "",
      }));
    } else {
      setFilePreview(null);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentCourse((prev) => ({
      ...prev,
      urlCover: value,
    }));
    if (value.trim()) {
      handleClearFile();
    }
  };

  const handleEdit = async () => {
    setIsLoading(true);

    try {
      const imageFile = fileInputRefEdit.current?.files?.[0] || null;
      await coursesApi.update(apiUrl, course.id, {
        name: currentCourse.name,
        path: currentCourse.path,
        imageFile,
        imageUrl: imageFile ? undefined : (currentCourse.urlCover?.trim() || undefined),
      });

      toast.success("Curso atualizado com sucesso!", {
        duration: 2000,
      });

      handleOpenChange(false);
      onUpdate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } | string } };
      const errorMessage =
        (typeof err?.response?.data === "object"
          ? err?.response?.data?.error
          : err?.response?.data) || "Erro ao atualizar o curso.";
      toast.error(errorMessage, {
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCurrentCourse(
      (prev) =>
        ({
          ...prev,
          [name]: value,
        } as Course)
    );
  };

  // Determine current active cover on the server for preview
  const currentCoverSrc = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {(!isControlled || trigger) && (
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button
              size="sm"
              className="bg-transparent text-white/70 outline-none border-b-2 border-white/10"
              variant="outline"
              onClick={() => handleOpenChange(true)}
            >
              Editar
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="md:max-w-[700px] max-w-80 glass-panel border-white/15 bg-zinc-950/95 text-white"
      >
        <DialogHeader>
          <DialogTitle className="mb-4">
            Editando - {course?.name || ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs text-zinc-300 font-medium block mb-1.5">
              Nome do curso
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={currentCourse?.name || ""}
              onChange={handleInputChange}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-2">
              Capa do curso (URL ou arquivo local):
            </h3>
            <Card className="w-full bg-white/[0.02] border-white/10">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label htmlFor="capaUrl" className="text-xs text-zinc-300 font-medium block mb-1">
                    URL da imagem
                  </Label>
                  <Input
                    type="url"
                    id="capaUrl"
                    name="urlCover"
                    value={currentCourse?.urlCover || ""}
                    onChange={handleUrlChange}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider">ou</span>
                  <div className="flex-1 border-t border-white/10"></div>
                </div>

                <div>
                  <Label htmlFor="capaFile" className="text-xs text-zinc-300 font-medium block mb-1">
                    Anexar nova imagem local
                  </Label>
                  <Input
                    type="file"
                    id="capaFile"
                    ref={fileInputRefEdit}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-white/5 border-white/10 text-white file:text-white file:bg-white/10 file:border-0 file:rounded-md file:mr-2 file:px-2 file:py-1 cursor-pointer"
                  />
                </div>

                {filePreview ? (
                  <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                    <img
                      src={filePreview}
                      alt="Prévia do novo anexo"
                      className="w-16 h-10 object-cover rounded border border-white/20"
                    />
                    <div className="flex-1 text-xs text-zinc-300 truncate">
                      <span className="text-emerald-400 font-medium block">Nova capa selecionada</span>
                      <span className="text-zinc-500 text-[10px]">Será salva ao confirmar</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleClearFile}
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                      title="Descartar anexo"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : currentCoverSrc ? (
                  <div className="flex items-center gap-3 p-2 bg-white/[0.03] rounded-lg border border-white/5">
                    <img
                      src={currentCoverSrc}
                      alt="Capa atual"
                      className="w-16 h-10 object-cover rounded border border-white/10 opacity-80"
                    />
                    <div className="flex-1 text-xs text-zinc-400">
                      <span className="font-medium text-zinc-300 block">Capa atual do curso</span>
                      <span className="text-[10px] text-zinc-500">
                        {course.isCoverUrl ? "Link externo" : "Arquivo local no servidor"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Label htmlFor="path" className="text-xs text-zinc-300 font-medium">
                Diretório (PATH) do curso
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-red-400 cursor-pointer underline text-[10px]">
                      Aviso de segurança
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 border-white/15 text-white text-xs max-w-xs">
                    Por motivos de segurança do navegador, o caminho absoluto do sistema deve ser inserido manualmente.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="text"
              id="path"
              name="path"
              value={currentCourse?.path || ""}
              onChange={handleInputChange}
              className="bg-white/5 border-white/10 text-white font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="bg-white/5 border-white/10 text-zinc-300 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleEdit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            {isLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
