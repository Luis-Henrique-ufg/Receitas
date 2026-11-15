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
import {
  PRESET_COURSE_CATEGORIES,
  getCourseCategoryTag,
  getCourseCoverPosition,
  saveLocalCourseCategory,
  saveLocalCourseCoverPosition,
} from "@/utils/courseCategory";
import CoverPositionControl from "./cover-position-control";
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
      const resolvedTag = getCourseCategoryTag(course);
      const resolvedPos = getCourseCoverPosition(course);
      setCurrentCourse({
        ...course,
        category: course.category || resolvedTag.label,
        coverPosition: resolvedPos,
      });
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
      const chosenCategory = (currentCourse.category || "").trim();
      const chosenPosition = (currentCourse.coverPosition || "50% 50%").trim();
      saveLocalCourseCategory(course.id, chosenCategory);
      saveLocalCourseCoverPosition(course.id, chosenPosition);
      await coursesApi.update(apiUrl, course.id, {
        name: currentCourse.name,
        path: currentCourse.path,
        category: chosenCategory,
        coverPosition: chosenPosition,
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

  const activePreviewSrc =
    filePreview ||
    (currentCourse.urlCover && currentCourse.urlCover.trim()
      ? currentCourse.urlCover.trim()
      : currentCoverSrc);

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
        className="md:max-w-[650px] max-w-sm max-h-[90vh] overflow-y-auto bg-card border border-border text-foreground rounded-3xl shadow-2xl p-6 sm:p-7"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-semibold text-foreground mb-2">
            Editando - {course?.name || ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-xs text-foreground font-medium block mb-1.5">
                Nome do curso
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={currentCourse?.name || ""}
                onChange={handleInputChange}
                className="bg-secondary/50 border-border text-foreground rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-xs text-foreground font-medium block mb-1.5">
                Categoria (Tag)
              </Label>
              <Input
                type="text"
                id="category"
                name="category"
                value={currentCourse?.category || ""}
                onChange={handleInputChange}
                placeholder="Ex: Engenharia, Literatura..."
                className="bg-secondary/50 border-border text-foreground rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COURSE_CATEGORIES.map((cat) => {
              const isSelected =
                (currentCourse?.category || "").trim().toLowerCase() ===
                cat.label.toLowerCase();
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() =>
                    setCurrentCourse((prev) => ({
                      ...prev,
                      category: cat.label,
                    }))
                  }
                  style={
                    isSelected
                      ? { backgroundColor: cat.bgColor, color: cat.textColor }
                      : undefined
                  }
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? "border-transparent shadow-sm"
                      : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div>
            <h3 className="text-xs font-medium text-foreground mb-2">
              Capa do curso (URL ou arquivo local):
            </h3>
            <Card className="w-full bg-secondary/30 border-border rounded-2xl">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label htmlFor="capaUrl" className="text-xs text-muted-foreground font-medium block mb-1">
                    URL da imagem
                  </Label>
                  <Input
                    type="url"
                    id="capaUrl"
                    name="urlCover"
                    value={currentCourse?.urlCover || ""}
                    onChange={handleUrlChange}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="bg-card border-border text-foreground rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">ou</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                <div>
                  <Label htmlFor="capaFile" className="text-xs text-muted-foreground font-medium block mb-1">
                    Anexar nova imagem local
                  </Label>
                  <Input
                    type="file"
                    id="capaFile"
                    ref={fileInputRefEdit}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-card border-border text-foreground rounded-xl file:text-foreground file:bg-secondary file:border-0 file:rounded-lg file:mr-2 file:px-2.5 file:py-1 cursor-pointer"
                  />
                </div>

                {filePreview ? (
                  <div className="flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border">
                    <img
                      src={filePreview}
                      alt="Prévia do novo anexo"
                      style={{ objectPosition: currentCourse.coverPosition || "50% 50%" }}
                      className="w-16 h-10 object-cover rounded-lg border border-border"
                    />
                    <div className="flex-1 text-xs text-foreground truncate">
                      <span className="text-accent font-semibold block">Nova capa selecionada</span>
                      <span className="text-muted-foreground text-[10px]">Será salva ao confirmar</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleClearFile}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Descartar anexo"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : currentCoverSrc ? (
                  <div className="flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border">
                    <img
                      src={currentCoverSrc}
                      alt="Capa atual"
                      style={{ objectPosition: currentCourse.coverPosition || "50% 50%" }}
                      className="w-16 h-10 object-cover rounded-lg border border-border opacity-90"
                    />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground block">Capa atual do curso</span>
                      <span className="text-[10px] text-muted-foreground">
                        {course.isCoverUrl ? "Link externo" : "Arquivo local no servidor"}
                      </span>
                    </div>
                  </div>
                ) : null}

                {activePreviewSrc && (
                  <CoverPositionControl
                    imageSrc={activePreviewSrc}
                    value={currentCourse.coverPosition || "50% 50%"}
                    onChange={(nextPos) =>
                      setCurrentCourse((prev) => ({
                        ...prev,
                        coverPosition: nextPos,
                      }))
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Label htmlFor="path" className="text-xs text-foreground font-medium">
                Diretório (PATH) do curso
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-primary cursor-pointer underline text-[10px]">
                      Aviso de segurança
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-card border-border text-foreground text-xs max-w-xs">
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
              className="bg-secondary/50 border-border text-foreground font-mono text-xs rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="rounded-full border-border text-foreground hover:bg-muted"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleEdit}
            disabled={isLoading}
            className="rounded-full bg-primary text-[#030607] font-semibold hover:brightness-105 shadow-md shadow-primary/20"
          >
            {isLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
