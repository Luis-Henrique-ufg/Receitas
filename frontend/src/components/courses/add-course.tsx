import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { Loader2, X } from "lucide-react";
import { coursesApi } from "@/services/coursesApi";

type Props = {
  onCreate: () => void;
};

export default function AddCourse({ onCreate }: Props) {
  const [courseName, setCourseName] = useState<string>("");
  const [imageURL, setImageURL] = useState<string>("");
  const [coursePath, setCoursePath] = useState<string>("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoadingManualInsertion, setIsLoadingManualInsertion] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { apiUrl } = useApiUrl();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (typeof URL.createObjectURL === "function") {
        setFilePreview(URL.createObjectURL(file));
      }
      setImageURL("");
    } else {
      setFilePreview(null);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageURL(e.target.value);
    if (e.target.value.trim() && fileInputRef.current) {
      fileInputRef.current.value = "";
      setFilePreview(null);
    }
  };

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFilePreview(null);
  };

  const handleSubmit = async () => {
    setIsLoadingManualInsertion(true);
    let createdSuccessfully = false;

    const finalPath = coursePath;

    if (!courseName.trim() || !finalPath.trim()) {
      toast.error("Informe o nome e o caminho do curso.");
      setIsLoadingManualInsertion(false);
      return;
    }

    try {
      const imageFile = fileInputRef.current?.files?.[0] || null;
      const result = await coursesApi.create(apiUrl, {
        name: courseName.trim(),
        path: finalPath.trim(),
        imageFile,
        imageUrl: imageFile ? undefined : (imageURL.trim() || undefined),
      });

      toast.success(`Curso adicionado: ${result.name}`, {
        duration: 2000,
        action: {
          label: "Ok",
          onClick: () => {},
        },
      });
      setIsOpen(false);
      createdSuccessfully = true;
      onCreate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } | string } };
      const errorMessage =
        (typeof err?.response?.data === "object"
          ? err?.response?.data?.error
          : err?.response?.data) || "Erro ao adicionar registro.";
      toast.error(errorMessage, {
        duration: 2000,
        action: {
          label: "Ok",
          onClick: () => {},
        },
      });
    } finally {
      setIsLoadingManualInsertion(false);
      if (createdSuccessfully) {
        setCourseName("");
        setImageURL("");
        setCoursePath("");
        handleClearFile();
      }
    }
  };

  return (
    <div className="flex gap-4 items-center">
      {isLoadingManualInsertion && (
        <div className="flex justify-center glass-panel px-8 py-2 rounded-xl text-sm items-center text-white/70">
          <Loader2 className="animate-spin h-4 mr-4 text-[#007bff]" />
          <p>Salvando curso...</p>
        </div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) handleClearFile();
        }}
      >
        <DialogTrigger asChild>
          <Button variant={"link"}>Adicionar manualmente</Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[700px] max-w-80 glass-panel border-white/15 bg-zinc-950/95 text-white">
          <DialogHeader>
            <DialogTitle className="mb-4">Cadastro de Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-xs text-zinc-300 font-medium block mb-1.5">
                Nome do curso
              </Label>
              <Input
                type="text"
                id="nome"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Ex: Estatística Avançada"
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
                      value={imageURL}
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
                      Anexar imagem local
                    </Label>
                    <Input
                      type="file"
                      id="capaFile"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="bg-white/5 border-white/10 text-white file:text-white file:bg-white/10 file:border-0 file:rounded-md file:mr-2 file:px-2 file:py-1 cursor-pointer"
                    />
                  </div>

                  {filePreview && (
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                      <img
                        src={filePreview}
                        alt="Prévia da capa local"
                        className="w-16 h-10 object-cover rounded border border-white/20"
                      />
                      <div className="flex-1 text-xs text-zinc-300 truncate">
                        <span className="text-emerald-400 font-medium block">Imagem local selecionada</span>
                        <span className="text-zinc-500 text-[10px]">Será salva no servidor</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClearFile}
                        className="h-7 w-7 text-zinc-400 hover:text-white"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Label htmlFor="path" className="text-xs text-zinc-300 font-medium block mb-1.5">
                Diretório (PATH) do curso
              </Label>
              <Input
                type="text"
                id="path"
                placeholder="Ex: C:\Users\kamik\Downloads\Linguagem C"
                value={coursePath}
                onChange={(e) => setCoursePath(e.target.value)}
                className="bg-white/5 border-white/10 text-white font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-white/5 border-white/10 text-zinc-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoadingManualInsertion}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
