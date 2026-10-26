import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useApiUrl from "@/hooks/useApiUrl";
import { toast } from "sonner";
import { useEffect } from "react";
import SubjectManager from "@/components/subjects/subject-manager";
import { BookOpen, Server, Settings } from "lucide-react";

const formSchema = z.object({
  url: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "Deve ser uma URL válida ou vazio para mesma origem",
    }),
});

export default function SettingsPage() {
  const { apiUrl, resetApiUrl, setApiUrl } = useApiUrl();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: apiUrl,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setApiUrl(values.url);
    toast.success("API atualizada com sucesso!");
  }

  useEffect(() => {
    form.setValue("url", apiUrl);
  }, [apiUrl, form]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 pb-2 border-b border-white/10">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Configurações
          </h1>
          <p className="text-sm text-zinc-400">
            Gerencie suas disciplinas acadêmicas e parâmetros de conexão do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="subjects"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Matérias Acadêmicas
          </TabsTrigger>
          <TabsTrigger
            value="connection"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Server className="w-4 h-4" />
            Conexão & API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="outline-none focus:outline-none">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
            <SubjectManager />
          </div>
        </TabsContent>

        <TabsContent value="connection" className="outline-none focus:outline-none">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#090d16]/80 backdrop-blur-xl max-w-xl">
            <h2 className="text-lg font-heading font-bold text-white mb-1">
              Endereço da API Backend
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Configure o endpoint base do Flask para chamadas de dados e vídeos.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 flex flex-col"
              >
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel className="text-zinc-300">URL Base</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: http://localhost:9823"
                          type="url"
                          className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500 font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="text-xs text-zinc-400">
                        Deixe em branco para usar a mesma origem (porta relativa). Não coloque &apos;/&apos; no final.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <div className="space-x-3 flex justify-end pt-2 border-t border-white/10">
                  <Button
                    type="button"
                    onClick={resetApiUrl}
                    variant="outline"
                    className="text-xs"
                  >
                    Restaurar Padrão
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                    Salvar Conexão
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
