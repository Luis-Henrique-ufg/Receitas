import { Course } from "@/models/models";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { AxiosError } from "axios";
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

export default function DeleteCourse({
  course,
  onUpdate,
  trigger,
  isOpen: controlledIsOpen,
  onClose,
}: Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const showConfirm = isControlled ? controlledIsOpen : internalIsOpen;

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

  const { apiUrl } = useApiUrl();

  const onDelete = async () => {
    try {
      await coursesApi.delete(apiUrl, course.id);
      toast.success("Excluído com sucesso!");
      handleOpenChange(false);
      onUpdate();
    } catch (error: unknown) {
      let msg = "Erro ao excluir o registro.";
      if (error instanceof AxiosError && error.response?.data) {
        msg =
          typeof error.response.data === "string"
            ? error.response.data
            : (error.response.data as { error?: string })?.error || msg;
      }
      toast.error(msg, {
        duration: 2000,
      });
    }
  };

  return (
    <>
      {trigger && (
        <div onClick={() => handleOpenChange(true)} className="w-full">
          {trigger}
        </div>
      )}
      {!trigger && !isControlled && (
        <Button
          className="bg-red-700 text-cyan-50 hover:bg-red-950 hover:text-white outline-none border-none"
          variant="outline"
          onClick={() => handleOpenChange(true)}
          size="sm"
        >
          Apagar
        </Button>
      )}
      <AlertDialog open={showConfirm} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-3xl shadow-2xl p-6 sm:p-7">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-semibold text-lg text-foreground">Confirmação de Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Tem certeza de que deseja excluir o curso &quot;{course.name}&quot;? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              onClick={() => handleOpenChange(false)}
              className="rounded-full border-border text-foreground hover:bg-muted"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
            >
              Excluir Curso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
