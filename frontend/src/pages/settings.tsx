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
import SyncManager from "@/components/sync/sync-manager";
import { BookOpen, Server, Settings, Timer, Check, Volume2, VolumeX, ArrowRightLeft } from "lucide-react";
import { usePomodoroStore, CompletionBehavior } from "@/store/usePomodoroStore";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  url: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "Deve ser uma URL válida ou vazio para mesma origem",
    }),
});

export default function SettingsPage() {
  const { apiUrl, resetApiUrl, setApiUrl } = useApiUrl();
  const {
    durations,
    updateDurations,
    completionBehavior,
    setCompletionBehavior,
    soundEnabled,
    toggleSound,
  } = usePomodoroStore();

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

  const completionOptions: {
    id: CompletionBehavior;
    title: string;
    description: string;
    badge?: string;
  }[] = [
    {
      id: "flow",
      title: "Continuar em foco (Modo Flow)",
      description:
        "O vídeo não pausa. O relógio passa a contar o prolongamento (+MM:SS) com aviso sonoro discreto e notificação.",
      badge: "Padrão recomendado",
    },
    {
      id: "strict",
      title: "Pausar e travar (Clássico)",
      description:
        "Ao bater 25:00, o vídeo é pausado automaticamente e o widget exige o início da pausa de descanso.",
    },
    {
      id: "prompt",
      title: "Perguntar",
      description:
        "Ao finalizar, exibe uma notificação para você escolher se quer continuar no prolongamento ou descansar.",
    },
  ];

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
            Gerencie disciplinas, sessões de foco contínuo e conexão com o servidor.
          </p>
        </div>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-6 flex-wrap">
          <TabsTrigger
            value="subjects"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Matérias Acadêmicas
          </TabsTrigger>
          <TabsTrigger
            value="pomodoro"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Timer className="w-4 h-4" />
            Sessões de Foco & Flow
          </TabsTrigger>
          <TabsTrigger
            value="sync"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Sincronização & Backup
          </TabsTrigger>
          <TabsTrigger
            value="connection"
            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Server className="w-4 h-4" />
            Conexão & API
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Matérias */}
        <TabsContent value="subjects" className="outline-none focus:outline-none">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
            <SubjectManager />
          </div>
        </TabsContent>

        {/* Tab 2: Pomodoro Flow Preferences */}
        <TabsContent value="pomodoro" className="outline-none focus:outline-none">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-[#090d16]/80 backdrop-blur-xl space-y-8 max-w-2xl">
            {/* Behavior on finish */}
            <div className="space-y-3">
              <h2 className="text-base font-heading font-semibold text-white">
                Ao terminar o tempo de foco:
              </h2>
              <p className="text-xs text-zinc-400">
                Escolha como o sistema reage quando os 25 minutos iniciais de foco forem atingidos.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {completionOptions.map((opt) => {
                  const isSelected = completionBehavior === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setCompletionBehavior(opt.id);
                        toast.success(`Comportamento atualizado para "${opt.title}"`);
                      }}
                      className={cn(
                        "p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                        isSelected
                          ? "border-blue-500 bg-blue-600/10 shadow-sm"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected
                            ? "border-blue-400 bg-blue-500 text-white"
                            : "border-white/30 bg-transparent"
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Durations */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-base font-heading font-semibold text-white">
                Duração dos Ciclos (minutos)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Foco Inicial</label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={durations.focus}
                    onChange={(e) =>
                      updateDurations({ focus: Math.max(1, Number(e.target.value)) })
                    }
                    className="bg-white/5 border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Pausa Curta</label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={durations.short_break}
                    onChange={(e) =>
                      updateDurations({ short_break: Math.max(1, Number(e.target.value)) })
                    }
                    className="bg-white/5 border-white/15 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Pausa Longa</label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={durations.long_break}
                    onChange={(e) =>
                      updateDurations({ long_break: Math.max(1, Number(e.target.value)) })
                    }
                    className="bg-white/5 border-white/15 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Sound notification toggle */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div>
                <p className="text-sm font-medium text-white">Avisos Sonoros</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Emitir sinal sonoro suave ao completar o tempo de foco ou pausa.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSound}
                className="gap-2 text-xs"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" /> Ativado
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-zinc-500" /> Desativado
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Sincronização & Backup */}
        <TabsContent value="sync" className="outline-none focus:outline-none">
          <SyncManager />
        </TabsContent>

        {/* Tab 4: Conexão API */}
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
