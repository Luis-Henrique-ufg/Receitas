import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Wifi,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  ArrowRightLeft,
  Calendar,
  BookOpen,
  StickyNote,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useApiUrl from "@/hooks/useApiUrl";
import { syncApi, SyncSummary } from "@/services/syncApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SyncPhase } from "@/machines/syncMachine";

export default function SyncManager() {
  const { apiUrl } = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Peer-to-peer Wi-Fi sync state
  const [remoteUrl, setRemoteUrl] = useState(() => {
    return localStorage.getItem("receitas_peer_sync_url") || "";
  });
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("idle");

  const isPeerSyncing = syncPhase === "peer_connecting" || syncPhase === "peer_syncing";
  const isImporting = syncPhase === "importing_file";
  const dragActive = syncPhase === "drag_hover";

  // Last sync results
  const [lastSummary, setLastSummary] = useState<{
    summary: SyncSummary;
    timestamp: string;
    twoWay?: boolean;
  } | null>(null);

  const handlePeerSync = async () => {
    if (!remoteUrl.trim()) {
      toast.error("Informe o IP ou endereço do notebook (ex: 192.168.0.25:9823)");
      return;
    }

    try {
      setSyncPhase("peer_connecting");
      localStorage.setItem("receitas_peer_sync_url", remoteUrl.trim());

      setSyncPhase("peer_syncing");
      const res = await syncApi.peerSync(apiUrl, remoteUrl.trim());
      setLastSummary({
        summary: res.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        twoWay: res.two_way,
      });

      setSyncPhase("success");
      toast.success(res.message, { duration: 4000 });
      window.dispatchEvent(new CustomEvent("statsUpdated"));
    } catch (err: unknown) {
      setSyncPhase("error");
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
          ? err.message
          : "Erro desconhecido na sincronização";
      toast.error(errorMsg || "Não foi possível conectar ao outro dispositivo.");
    }
  };

  const handleDownloadBackup = () => {
    try {
      const downloadUrl = syncApi.downloadBackupUrl(apiUrl);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Arquivo de sincronização gerado com sucesso!");
    } catch {
      toast.error("Erro ao iniciar download do arquivo de sincronização.");
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Selecione um arquivo de sincronização .json válido");
      return;
    }

    try {
      setSyncPhase("importing_file");
      const res = await syncApi.uploadFile(apiUrl, file);
      setLastSummary({
        summary: res.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      setSyncPhase("success");
      toast.success(res.message);
      window.dispatchEvent(new CustomEvent("statsUpdated"));
    } catch (err: unknown) {
      setSyncPhase("error");
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Erro ao importar dados de sincronização";
      toast.error(errorMsg);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSyncPhase("idle");
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (syncPhase !== "drag_hover") {
      setSyncPhase("drag_hover");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (syncPhase === "drag_hover") {
      setSyncPhase("idle");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border tangerina-card space-y-6">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground tracking-[-0.015em] flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Sincronização entre Notebook e Desktop
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Unifique suas horas de estudo, pomodoros, progresso de aulas concluídas e anotações
            entre computadores com mesclagem inteligente e sem perda de dados.
          </p>
        </div>

        {/* Option 1: Direct Network / Wi-Fi Sync */}
        <div className="p-5 rounded-2xl border border-border bg-secondary/35 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/12 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Sincronização Direta via Wi-Fi (Mesma Rede)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Conecta diretamente ao aplicativo rodando no notebook ou desktop para sincronizar em dois sentidos.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-[#007A72] dark:text-[#33C7BC] border border-accent/30 shrink-0">
              Bidirecional
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="IP do notebook:porta (ex: 192.168.1.15:9823)"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                className="bg-card border-border text-foreground font-mono text-xs placeholder:text-muted-foreground h-10 rounded-xl"
              />
            </div>
            <Button
              onClick={handlePeerSync}
              disabled={isPeerSyncing}
              className="bg-primary hover:brightness-105 text-[#030607] text-xs font-semibold h-10 px-4 rounded-xl shrink-0 gap-1.5 shadow-[0_4px_14px_rgba(255,112,32,0.3)]"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isPeerSyncing && "animate-spin")} />
              <span>{isPeerSyncing ? "Sincronizando..." : "Sincronizar Agora"}</span>
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-start gap-2 bg-card/80 p-3 rounded-xl border border-border">
            <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Como achar o IP no notebook:</strong> Abra o PowerShell no notebook e digite{" "}
              <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">ipconfig</code>. Procure pelo &quot;Endereço IPv4&quot;
              (geralmente algo como <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">192.168.x.x</code>). Digite o IP aqui
              (a porta <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">:9823</code> ou <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">:5050</code> é detectada automaticamente).
            </span>
          </div>
        </div>

        {/* Option 2: Export & Import File Sync */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Card */}
          <div className="p-5 rounded-2xl border border-border bg-secondary/35 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 text-[#007A72] dark:text-[#33C7BC] flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">1. Exportar deste computador</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gera um arquivo compacto <code className="text-foreground font-mono bg-card px-1.5 py-0.5 rounded border border-border">.json</code> contendo todo o seu
                histórico de estudos, aulas concluídas, matérias e anotações.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBackup}
              className="w-full text-xs font-medium bg-card hover:bg-secondary border-border text-foreground gap-2 h-10 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Baixar Arquivo de Sincronização</span>
            </Button>
          </div>

          {/* Import Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all",
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/35"
            )}
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-primary/12 border border-primary/25 text-primary flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">2. Importar do notebook</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Selecione ou arraste o arquivo <code className="text-foreground font-mono bg-card px-1.5 py-0.5 rounded border border-border">.json</code> gerado no outro
                computador. Os dados serão mesclados com segurança.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              size="sm"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs font-semibold bg-primary hover:brightness-105 text-[#030607] gap-2 h-10 rounded-xl shadow-[0_4px_14px_rgba(255,112,32,0.3)]"
            >
              <Upload className={cn("w-3.5 h-3.5", isImporting && "animate-spin")} />
              <span>{isImporting ? "Mesclando dados..." : "Importar e Mesclar Arquivo"}</span>
            </Button>
          </div>
        </div>

        {/* Sync Feedback / Summary */}
        {lastSummary && (
          <div className="p-4 rounded-2xl border border-accent/35 bg-accent/10 text-foreground space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#007A72] dark:text-[#33C7BC] text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sincronização concluída às {lastSummary.timestamp}</span>
              </div>
              {lastSummary.twoWay && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-[#007A72] dark:text-[#33C7BC] border border-accent/30">
                  2-Way Sync OK
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-card p-2.5 rounded-xl border border-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold font-mono text-foreground">{lastSummary.summary.days_synced}</div>
                  <div className="text-muted-foreground text-[10px]">Dias de estudo</div>
                </div>
              </div>

              <div className="bg-card p-2.5 rounded-xl border border-border flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold font-mono text-foreground">{lastSummary.summary.lessons_updated}</div>
                  <div className="text-muted-foreground text-[10px]">Aulas atualizadas</div>
                </div>
              </div>

              <div className="bg-card p-2.5 rounded-xl border border-border flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#E33D6C] shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold font-mono text-foreground">{lastSummary.summary.notes_added}</div>
                  <div className="text-muted-foreground text-[10px]">Anotações unificadas</div>
                </div>
              </div>

              <div className="bg-card p-2.5 rounded-xl border border-border flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#663399] dark:text-[#C39BD3] shrink-0" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold font-mono text-foreground">{lastSummary.summary.events_synced}</div>
                  <div className="text-muted-foreground text-[10px]">Prazos na agenda</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Safety Policy Info */}
        <div className="p-4 rounded-2xl border border-border bg-secondary/25 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Como funciona a política de mesclagem inteligente (Zero Perda de Dados)
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-foreground">Horas e Pomodoros:</strong> Se você estudou no mesmo dia nos dois
              dispositivos, os tempos são combinados por matéria e curso, preservando sempre o maior progresso.
            </li>
            <li>
              <strong className="text-foreground">Aulas Concluídas:</strong> Uma aula marcada como assistida em qualquer um
              dos dois computadores continuará concluída.
            </li>
            <li>
              <strong className="text-foreground">Anotações com Timestamp:</strong> Anotações feitas no notebook ou desktop
              são unificadas, evitando duplicatas exatas.
            </li>
            <li>
              <strong className="text-foreground">Disciplinas e Agenda:</strong> Suas metas semanais e prazos de prova são
              preservados e sincronizados integralmente.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
