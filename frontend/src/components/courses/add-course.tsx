import { useRef, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { coursesApi } from "@/services/coursesApi";

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
        imageUrl: imageURL || undefined,
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
            <Button type="button" onClick={handleSubmit} disabled={isLoadingManualInsertion}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
