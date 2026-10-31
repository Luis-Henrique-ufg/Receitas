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
import { useRef, useState, useEffect } from "react";

import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { coursesApi } from "@/services/coursesApi";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
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
      if (fileInputRefEdit.current) {
        fileInputRefEdit.current.value = "";
      }
    }
  }, [course, isOpen]);

  const { apiUrl } = useApiUrl();

  const handleEdit = async () => {
    setIsLoading(true);

    try {
      const imageFile = fileInputRefEdit.current?.files?.[0] || null;
      await coursesApi.update(apiUrl, course.id, {
        name: currentCourse.name,
        path: currentCourse.path,
        imageFile,
        imageUrl: currentCourse.urlCover || undefined,
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
          <DialogTitle className="mb-6">
            Editando - {course?.name || ""}
          </DialogTitle>
        </DialogHeader>
        <div className="my-2 flex items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Nome do curso
          </Label>
        </div>
        <Input
          type="text"
          id="name"
          name="name"
          value={currentCourse?.name || ""}
          onChange={handleInputChange}
          className="bg-white/5 border-white/10 text-white"
        />
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mt-2">Quer colocar alguma capa? se sim, só escolher...</h3>
          <Card className="w-full my-4 bg-white/[0.02] border-white/10">
            <CardContent>
              <div>
                <div className="my-2">
                  <Label htmlFor="capaUrl" className="text-right">
                    URL da imagem
                  </Label>
                </div>
                <Input
                  type="url"
                  id="capaUrl"
                  name="urlCover"
                  value={currentCourse?.urlCover || ""}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <p className="my-2 text-xs text-zinc-400">Ou</p>
              <div>
                <div className="my-2">
                  <Label htmlFor="capaFile" className="text-right">
                    Anexo
                  </Label>
                </div>
                <Input
                  type="file"
                  id="capaFile"
                  ref={fileInputRefEdit}
                  className="bg-white/5 border-white/10 text-white file:text-white file:bg-white/10"
                />
              </div>
            </CardContent>
          </Card>
          <h3 className="text-sm font-medium text-zinc-300">Agora, atualize o diretório do curso.</h3>
          <div className="my-2 flex items-center gap-4">
            <Label htmlFor="path" className="text-right">
              PATH do curso
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-red-500 cursor-pointer underline text-xs">Aviso</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Por motivos de segurança, os navegadores não permitem a
                    coleta do path por input, deve ser adicionado manualmente.
                  </p>
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
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
