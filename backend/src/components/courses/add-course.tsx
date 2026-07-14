import { useRef, useState, useEffect } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { Loader2 } from "lucide-react";

type Props = {
  onCreate: () => void;
};

export default function AddCourse({ onCreate }: Props) {
  const [courseName, setCourseName] = useState<string>("");
  const [imageURL, setImageURL] = useState<string>("");
  const [coursePath, setCoursePath] = useState<string>("");
  const [isLoadingManualInsertion, setIsLoadingManualInsertion] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const { apiUrl } = useApiUrl();

  // Removed scanPaths since user wants to paste manual path

  // Removed automaticallyAddCourses
  const handleSubmit = async () => {
    setIsLoadingManualInsertion(true);
    let createdSuccessfully = false;
    const formData = new FormData();

    // Converte o caminho do Windows (C:\Users\kamik\Downloads\Linguagem C) para o caminho do Docker (/courses/Linguagem C)
    let finalPath = coursePath;
    if (finalPath.includes("\\") || !finalPath.startsWith("/courses/")) {
      const parts = finalPath.split(/[\\/]/); // Divide por \ ou /
      const lastFolder = parts.filter(Boolean).pop(); // Pega a última pasta (ex: "Linguagem C")
      if (lastFolder) {
        finalPath = `/courses/${lastFolder}`;
      }
    }

    if (!courseName.trim() || !finalPath.trim()) {
      toast.error("Informe o nome e o caminho do curso.");
      setIsLoadingManualInsertion(false);
      return;
    }

    formData.append("name", courseName);
    formData.append("path", finalPath);

    if (
      fileInputRef.current &&
      fileInputRef.current.files &&
      fileInputRef.current.files[0]
    ) {
      formData.append("imageFile", fileInputRef.current.files[0]);
    } else if (imageURL) {
      formData.append("imageURL", imageURL);
    }

    try {
      const response = await fetch(`${apiUrl}/api/courses`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Erro ao adicionar registro.";

        try {
          const responseBody = await response.json();
          errorMessage = responseBody?.error ?? errorMessage;
        } catch {
          try {
            const responseText = await response.text();
            if (responseText.trim()) {
              errorMessage = responseText;
            }
          } catch {
            // Mantém a mensagem padrão.
          }
        }

        toast.error(errorMessage);
        return;
      }

      const result = await response.json();
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
    } catch (error) {
      toast.error("Não foi possível conectar ao backend.", {
        duration: 2000,
        action: {
          label: "Ok",
          onClick: () => ``,
        },
      });
    } finally {
      setIsLoadingManualInsertion(false);
      if (createdSuccessfully) {
        setCourseName("");
        setImageURL("");
        setCoursePath("");
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={"link"}>Adicionar manualmente</Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[700px] max-w-80">
          <DialogHeader>
            <DialogTitle className="mb-6">Cadastro</DialogTitle>
          </DialogHeader>
          <div className="my-2 flex items-center gap-4">
            <Label htmlFor="nome" className="text-right">
              Nome do curso
            </Label>
          </div>
          <Input
            type="text"
            id="nome"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <div>
            <h3>Quer colocar alguma capa? se sim, só escolher...</h3>
            <Card className="w-full my-4">
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
                    value={imageURL}
                    onChange={(e) => setImageURL(e.target.value)}
                  />
                </div>
                <p className="my-2">Ou</p>
                <div>
                  <div className="my-2">
                    <Label htmlFor="capaFile" className="text-right">
                      Anexo
                    </Label>
                  </div>
                  <Input type="file" id="capaFile" ref={fileInputRef} />
                </div>
              </CardContent>
            </Card>
            <Input
              type="text"
              id="path"
              placeholder="Ex: C:\Users\kamik\Downloads\Linguagem C"
              value={coursePath}
              onChange={(e) => setCoursePath(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSubmit}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
