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

export default function SyncManager() {
  const { apiUrl } = useApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Peer-to-peer Wi-Fi sync state
  const [remoteUrl, setRemoteUrl] = useState(() => {
    return localStorage.getItem("receitas_peer_sync_url") || "";
  });
  const [isPeerSyncing, setIsPeerSyncing] = useState(false);

  // File import state
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      setIsPeerSyncing(true);
      localStorage.setItem("receitas_peer_sync_url", remoteUrl.trim());

      const res = await syncApi.peerSync(apiUrl, remoteUrl.trim());
      setLastSummary({
        summary: res.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        twoWay: res.two_way,
      });

      toast.success(res.message, { duration: 4000 });
      window.dispatchEvent(new CustomEvent("statsUpdated"));
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
          ? err.message
          : "Erro desconhecido na sincronização";
      toast.error(errorMsg || "Não foi possível conectar ao outro dispositivo.");
    } finally {
      setIsPeerSyncing(false);
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
      setIsImporting(true);
      const res = await syncApi.uploadFile(apiUrl, file);
      setLastSummary({
        summary: res.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      toast.success(res.message);
      window.dispatchEvent(new CustomEvent("statsUpdated"));
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Erro ao importar dados de sincronização";
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
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
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-heading font-bold text-white tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-blue-400" />
          Sincronização entre Notebook e Desktop
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Unifique suas horas de estudo, pomodoros, progresso de aulas concluídas e anotações
          entre computadores com mesclagem inteligente e sem perda de dados.
        </p>
      </div>

      {/* Option 1: Direct Network / Wi-Fi Sync */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Sincronização Direta via Wi-Fi (Mesma Rede)
              </h3>
              <p className="text-xs text-zinc-400">
                Conecta diretamente ao aplicativo rodando no notebook ou desktop para sincronizar em dois sentidos.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
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
              className="bg-white/5 border-white/15 text-white font-mono text-xs placeholder:text-zinc-500 h-9"
            />
          </div>
          <Button
            onClick={handlePeerSync}
            disabled={isPeerSyncing}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold h-9 px-4 shrink-0 gap-1.5 shadow-md shadow-blue-500/20"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isPeerSyncing && "animate-spin")} />
            <span>{isPeerSyncing ? "Sincronizando..." : "Sincronizar Agora"}</span>
          </Button>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-start gap-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <span>
            <strong>Como achar o IP no notebook:</strong> Abra o PowerShell no notebook e digite{" "}
            <code className="text-cyan-300 font-mono">ipconfig</code>. Procure pelo &quot;Endereço IPv4&quot;
            (geralmente algo como <code className="text-cyan-300 font-mono">192.168.x.x</code>). Digite o IP aqui
            (a porta <code className="text-cyan-300 font-mono">:9823</code> ou <code className="text-cyan-300 font-mono">:5050</code> é detectada automaticamente).
          </span>
        </div>
      </div>

      {/* Option 2: Export & Import File Sync */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">1. Exportar deste computador</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gera um arquivo compacto <code className="text-zinc-300 font-mono">.json</code> contendo todo o seu
              histórico de estudos, aulas concluídas, matérias e anotações.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBackup}
            className="w-full text-xs font-medium bg-white/5 hover:bg-white/10 border-white/15 text-white gap-2 h-9"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Baixar Arquivo de Sincronização</span>
          </Button>
        </div>

        {/* Import Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "glass-panel p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all",
            dragActive
              ? "border-blue-400 bg-blue-500/10"
              : "border-white/10 bg-white/[0.02]"
          )}
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">2. Importar do notebook</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Selecione ou arraste o arquivo <code className="text-zinc-300 font-mono">.json</code> gerado no outro
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
            className="w-full text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white gap-2 h-9 shadow-md shadow-indigo-500/20"
          >
            <Upload className={cn("w-3.5 h-3.5", isImporting && "animate-spin")} />
            <span>{isImporting ? "Mesclando dados..." : "Importar e Mesclar Arquivo"}</span>
          </Button>
        </div>
      </div>

      {/* Sync Feedback / Summary */}
      {lastSummary && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-white space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sincronização concluída às {lastSummary.timestamp}</span>
            </div>
            {lastSummary.twoWay && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                2-Way Sync OK
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <div className="font-bold font-mono">{lastSummary.summary.days_synced}</div>
                <div className="text-zinc-400 text-[10px]">Dias de estudo</div>
              </div>
            </div>

            <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <div className="font-bold font-mono">{lastSummary.summary.lessons_updated}</div>
                <div className="text-zinc-400 text-[10px]">Aulas atualizadas</div>
              </div>
            </div>

            <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <div className="font-bold font-mono">{lastSummary.summary.notes_added}</div>
                <div className="text-zinc-400 text-[10px]">Anotações unificadas</div>
              </div>
            </div>

            <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <div className="font-bold font-mono">{lastSummary.summary.events_synced}</div>
                <div className="text-zinc-400 text-[10px]">Prazos na agenda</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Policy Info */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.01] space-y-2">
        <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Como funciona a política de mesclagem inteligente (Zero Perda de Dados)
        </h4>
        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-zinc-300">Horas e Pomodoros:</strong> Se você estudou no mesmo dia nos dois
            dispositivos, os tempos são combinados por matéria e curso, preservando sempre o maior progresso.
          </li>
          <li>
            <strong className="text-zinc-300">Aulas Concluídas:</strong> Uma aula marcada como assistida em qualquer um
            dos dois computadores continuará concluída.
          </li>
          <li>
            <strong className="text-zinc-300">Anotações com Timestamp:</strong> Anotações feitas no notebook ou desktop
            são unificadas, evitando duplicatas exatas.
          </li>
          <li>
            <strong className="text-zinc-300">Disciplinas e Agenda:</strong> Suas metas semanais e prazos de prova são
            preservados e sincronizados integralmente.
          </li>
        </ul>
      </div>
    </div>
  );
}
