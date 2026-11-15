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
import {
  PRESET_COURSE_CATEGORIES,
  saveLocalCourseCategory,
  saveLocalCourseCoverPosition,
} from "@/utils/courseCategory";
import CoverPositionControl from "./cover-position-control";

type Props = {
  onCreate: () => void;
};

export default function AddCourse({ onCreate }: Props) {
  const [courseName, setCourseName] = useState<string>("");
  const [courseCategory, setCourseCategory] = useState<string>("");
  const [coverPosition, setCoverPosition] = useState<string>("50% 50%");
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

    try {
      const selectedFile = fileInputRef.current?.files?.[0] || null;

      const created = await coursesApi.create(apiUrl, {
        name: courseName.trim(),
        category: courseCategory.trim() || undefined,
        coverPosition,
        imageFile: selectedFile,
        imageUrl: selectedFile ? undefined : imageURL.trim() || undefined,
        path: coursePath.trim(),
      });

      if (created?.id) {
        if (courseCategory.trim()) {
          saveLocalCourseCategory(created.id, courseCategory.trim());
        }
        saveLocalCourseCoverPosition(created.id, coverPosition);
      }

      toast.success("Curso cadastrado com sucesso!");
      onCreate();
      setIsOpen(false);
      setCourseName("");
      setCourseCategory("");
      setCoverPosition("50% 50%");
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
          <Button className="rounded-xl bg-primary text-[#030607] font-semibold text-[14px] hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98] shadow-[0_4px_14px_rgba(255,112,32,0.3)] flex items-center gap-2 px-5 py-2.5 h-10 transition-all cursor-pointer">
            <Plus className="w-4 h-4 stroke-[2.3]" />
            <span>Adicionar Novo Curso</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[650px] max-w-sm max-h-[90vh] overflow-y-auto bg-card border border-border text-foreground rounded-3xl shadow-2xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-semibold text-foreground mb-2">
              Cadastro de Novo Curso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="bg-secondary/50 border-border text-foreground rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="categoria" className="text-xs text-foreground font-medium block mb-1.5">
                  Categoria (Tag)
                </Label>
                <Input
                  type="text"
                  id="categoria"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  placeholder="Ex: Engenharia, Literatura..."
                  className="bg-secondary/50 border-border text-foreground rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COURSE_CATEGORIES.map((cat) => {
                const isSelected =
                  courseCategory.trim().toLowerCase() === cat.label.toLowerCase();
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCourseCategory(cat.label)}
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
                        style={{ objectPosition: coverPosition }}
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

                  {(filePreview || imageURL.trim()) && (
                    <CoverPositionControl
                      imageSrc={filePreview || imageURL.trim()}
                      value={coverPosition}
                      onChange={setCoverPosition}
                    />
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
