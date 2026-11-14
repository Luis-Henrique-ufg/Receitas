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
import { Loader2, Plus, X } from "lucide-react";
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
    if (!courseName.trim() || !coursePath.trim()) {
      toast.error("Preencha ao menos o nome do curso e o caminho das pastas.");
      return;
    }

    setIsLoadingManualInsertion(true);
    let uploadedImageUrl = imageURL.trim();

    try {
      const selectedFile = fileInputRef.current?.files?.[0];
      if (selectedFile) {
        toast.info("Enviando imagem de capa...");
        const uploadRes = await coursesApi.uploadCover(apiUrl, selectedFile);
        if (uploadRes && uploadRes.url) {
          uploadedImageUrl = uploadRes.url;
        } else {
          throw new Error("Não foi possível salvar o arquivo da imagem.");
        }
      }

      await coursesApi.create(apiUrl, {
        name: courseName.trim(),
        image_url: uploadedImageUrl,
        path: coursePath.trim(),
      });

      toast.success("Curso cadastrado com sucesso!");
      onCreate();
      setIsOpen(false);
      setCourseName("");
      setImageURL("");
      setCoursePath("");
      handleClearFile();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Erro desconhecido ao cadastrar curso.";
      toast.error(message);
    } finally {
      setIsLoadingManualInsertion(false);
    }
  };

  return (
    <div className="flex gap-4 items-center">
      {isLoadingManualInsertion && (
        <div className="flex justify-center bg-card border border-border px-6 py-2 rounded-full text-xs items-center text-muted-foreground shadow-sm">
          <Loader2 className="animate-spin h-3.5 w-3.5 mr-2 text-primary" />
          <span>Salvando curso...</span>
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
          <Button className="rounded-full bg-primary text-[#030607] font-semibold hover:brightness-105 active:scale-[0.98] shadow-md shadow-primary/20 flex items-center gap-2 px-5 py-2.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Curso</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[650px] max-w-sm bg-card border border-border text-foreground rounded-3xl shadow-2xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-semibold text-foreground mb-2">
              Cadastro de Novo Curso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="nome" className="text-xs text-foreground font-medium block mb-1.5">
                Nome do curso
              </Label>
              <Input
                type="text"
                id="nome"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Ex: Linguagem C o Curso Definitivo"
                className="bg-muted/40 border-border text-foreground rounded-xl"
              />
            </div>

            <div>
              <h3 className="text-xs font-medium text-foreground mb-2">
                Capa do curso (URL ou arquivo local):
              </h3>
              <Card className="w-full bg-muted/20 border-border rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label htmlFor="capaUrl" className="text-xs text-muted-foreground font-medium block mb-1">
                      URL da imagem
                    </Label>
                    <Input
                      type="url"
                      id="capaUrl"
                      value={imageURL}
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
                      Anexar imagem local
                    </Label>
                    <Input
                      type="file"
                      id="capaFile"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="bg-card border-border text-foreground rounded-xl file:text-foreground file:bg-muted file:border-0 file:rounded-lg file:mr-2 file:px-2.5 file:py-1 cursor-pointer"
                    />
                  </div>

                  {filePreview && (
                    <div className="flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border">
                      <img
                        src={filePreview}
                        alt="Prévia da capa local"
                        className="w-16 h-10 object-cover rounded-lg border border-border"
                      />
                      <div className="flex-1 text-xs text-foreground truncate">
                        <span className="text-primary font-medium block">Imagem local selecionada</span>
                        <span className="text-muted-foreground text-[10px]">Será salva no servidor</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClearFile}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
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
              <Label htmlFor="path" className="text-xs text-foreground font-medium block mb-1.5">
                Diretório (PATH) do curso
              </Label>
              <Input
                type="text"
                id="path"
                placeholder="Ex: C:\Users\kamik\Downloads\Linguagem C"
                value={coursePath}
                onChange={(e) => setCoursePath(e.target.value)}
                className="bg-muted/40 border-border text-foreground font-mono text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="rounded-full border-border text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoadingManualInsertion}
              className="rounded-full bg-primary text-[#030607] font-semibold hover:brightness-105 shadow-md shadow-primary/20"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
