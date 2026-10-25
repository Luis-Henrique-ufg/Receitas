import { Progress } from "./ui/progress";
import { formatRelativeTime } from "@/utils/utils";

type Props = {
  value?: number;
  hideValue?: boolean;
  totalLessons?: number | null;
  completedLessons?: number | null;
  showTitle?: boolean;
  remainingSeconds?: number | null;
  estimatedFinishMonth?: string | null;
  lastViewedAt?: number | null;
};

export default function ProgressCard({
  value = 0,
  hideValue = false,
  totalLessons,
  completedLessons,
  showTitle = true,
  remainingSeconds,
  estimatedFinishMonth,
  lastViewedAt,
}: Props) {
  const roundedValue = Math.round(Number(value) || 0);
  
  const getStatusBadge = () => {
    if (roundedValue === 0) {
      return (
        <span className="glass-panel px-2.5 py-0.5 rounded-full text-[11px] font-medium text-zinc-300 border border-white/10 bg-white/[0.04] inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          Não iniciado
        </span>
      );
    }
    if (roundedValue === 100) {
      return (
        <span className="glass-panel px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-300 border border-emerald-500/20 bg-emerald-500/10 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          Concluído
        </span>
      );
    }
    return (
      <span className="glass-panel px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 border border-white/10 bg-white/[0.04] inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#007bff] shrink-0" />
        Em andamento
      </span>
    );
  };

  const remaining = totalLessons !== null && totalLessons !== undefined && totalLessons > 0
    ? Math.max(0, totalLessons - (completedLessons ?? Math.round((roundedValue / 100) * totalLessons)))
    : null;

  const renderSecondaryInfo = () => {
    if (roundedValue === 100) {
      return (
        <span className="text-xs text-emerald-400/90 tracking-tight font-medium">
          Todas as {totalLessons} aulas concluídas!
        </span>
      );
    }

    if (totalLessons === null || totalLessons === undefined || totalLessons === 0) {
      return null;
    }

    let remainingText = "";
    if (remainingSeconds !== null && remainingSeconds !== undefined && remainingSeconds > 0) {
      const hours = Math.round(remainingSeconds / 3600);
      remainingText = hours > 0 ? `~${hours} h restantes` : `< 1 h restante`;
    } else {
      remainingText = `${remaining} ${remaining === 1 ? "aula restante" : "aulas restantes"}`;
    }

    const relTime = formatRelativeTime(lastViewedAt ?? undefined);
    const lastWatchedText = relTime ? ` · última aula ${relTime}` : "";

    return (
      <span className="text-xs text-zinc-400 tracking-tight">
        {remainingText}{lastWatchedText}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {showTitle && (
        <div className="flex justify-between items-center w-full text-xs">
          <span className="text-white/60 font-medium tracking-wide">Seu progresso</span>
          <div className="flex items-center gap-1 text-white font-semibold tabular-nums tracking-tight">
            <span>{roundedValue}%</span>
            {roundedValue > 0 && roundedValue < 100 ? (
              <span className="text-zinc-400 font-normal">
                {estimatedFinishMonth && estimatedFinishMonth !== "sem previsão ainda"
                  ? ` · termina em ~${estimatedFinishMonth}`
                  : " · sem previsão ainda"}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <Progress value={roundedValue} className="h-2" />

      {!hideValue && (
        <div className="flex flex-col items-start gap-1.5 mt-0.5">
          {getStatusBadge()}
          {renderSecondaryInfo()}
        </div>
      )}
    </div>
  );
}

