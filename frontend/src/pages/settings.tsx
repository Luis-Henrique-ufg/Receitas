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
    <div className="w-full space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-[28px] font-display font-medium text-foreground tracking-[-0.02em] leading-[1.15]">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie disciplinas, sessões de foco contínuo e conexão com o servidor
          </p>
        </div>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="bg-secondary/80 dark:bg-card border border-border p-1 rounded-full mb-6 inline-flex flex-wrap items-center gap-1 h-auto shadow-sm">
          <TabsTrigger
            value="subjects"
            title="Matérias Acadêmicas"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-[#030607] data-[state=active]:font-semibold text-muted-foreground hover:text-foreground hover:bg-card/60 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent select-none cursor-pointer"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Matérias</span>
          </TabsTrigger>
          <TabsTrigger
            value="pomodoro"
            title="Sessões de Foco & Pomodoro"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-[#030607] data-[state=active]:font-semibold text-muted-foreground hover:text-foreground hover:bg-card/60 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent select-none cursor-pointer"
          >
            <Timer className="w-4 h-4 shrink-0" />
            <span>Foco</span>
          </TabsTrigger>
          <TabsTrigger
            value="sync"
            title="Sincronização & Backup"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-[#030607] data-[state=active]:font-semibold text-muted-foreground hover:text-foreground hover:bg-card/60 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent select-none cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span>Backup</span>
          </TabsTrigger>
          <TabsTrigger
            value="connection"
            title="Conexão & API"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-[#030607] data-[state=active]:font-semibold text-muted-foreground hover:text-foreground hover:bg-card/60 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent select-none cursor-pointer"
          >
            <Server className="w-4 h-4 shrink-0" />
            <span>API</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Matérias */}
        <TabsContent value="subjects" className="outline-none focus:outline-none">
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border tangerina-card">
            <SubjectManager />
          </div>
        </TabsContent>

        {/* Tab 2: Pomodoro Flow Preferences */}
        <TabsContent value="pomodoro" className="outline-none focus:outline-none">
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border tangerina-card space-y-8 max-w-3xl">
            {/* Behavior on finish */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-display font-semibold text-foreground tracking-[-0.01em]">
                Ao terminar o tempo de foco:
              </h2>
              <p className="text-xs text-muted-foreground">
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
                        "p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3",
                        isSelected
                          ? "border-primary bg-primary/[0.08] shadow-sm"
                          : "border-border bg-secondary/35 hover:bg-secondary/70"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-[#030607]"
                            : "border-border bg-transparent"
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/12 border border-primary/30 text-primary font-semibold">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Durations */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h2 className="text-base sm:text-lg font-display font-semibold text-foreground tracking-[-0.01em]">
                Duração dos Ciclos (minutos)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Foco Inicial</label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={durations.focus}
                    onChange={(e) =>
                      updateDurations({ focus: Math.max(1, Number(e.target.value)) })
                    }
                    className="bg-secondary/50 border-border text-foreground font-mono rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Pausa Curta</label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={durations.short_break}
                    onChange={(e) =>
                      updateDurations({ short_break: Math.max(1, Number(e.target.value)) })
                    }
                    className="bg-secondary/50 border-border text-foreground font-mono rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Pausa Longa</label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={durations.long_break}
                    onChange={(e) =>
                      updateDurations({ long_break: Math.max(1, Number(e.target.value)) })
                    }
                    className="bg-secondary/50 border-border text-foreground font-mono rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Sound notification toggle */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Avisos Sonoros</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Emitir sinal sonoro suave ao completar o tempo de foco ou pausa.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSound}
                className="gap-2 text-xs rounded-xl bg-secondary/50 border-border hover:bg-secondary text-foreground"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-accent" /> Ativado
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-muted-foreground" /> Desativado
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
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border tangerina-card max-w-2xl">
            <h2 className="text-lg font-display font-semibold text-foreground tracking-[-0.015em] mb-1">
              Endereço da API Backend
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
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
                      <FormLabel className="text-foreground">URL Base</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: http://localhost:9823"
                          type="url"
                          className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="text-xs text-muted-foreground">
                        Deixe em branco para usar a mesma origem (porta relativa). Não coloque &apos;/&apos; no final.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <div className="space-x-3 flex justify-end pt-3 border-t border-border">
                  <Button
                    type="button"
                    onClick={resetApiUrl}
                    variant="outline"
                    className="text-xs rounded-xl bg-secondary/50 border-border hover:bg-secondary text-foreground"
                  >
                    Restaurar Padrão
                  </Button>
                  <Button type="submit" className="text-xs font-semibold rounded-xl bg-primary hover:brightness-105 text-[#030607] shadow-[0_4px_14px_rgba(255,112,32,0.3)]">
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
