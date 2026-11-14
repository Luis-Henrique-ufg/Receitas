import { Progress } from "./ui/progress";
import { formatRelativeTime, formatRelativeDate } from "@/utils/utils";

type Props = {
  value?: number;
  hideValue?: boolean;
  totalLessons?: number | null;
  completedLessons?: number | null;
  showTitle?: boolean;
  remainingSeconds?: number | null;
  estimatedFinishMonth?: string | null;
  lastViewedAt?: number | null;
  lastStudiedDate?: string | null;
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
  lastStudiedDate,
}: Props) {
  const roundedValue = Math.round(Number(value) || 0);
  
  const getStatusBadge = () => {
    if (roundedValue === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-muted-foreground border border-border bg-secondary/80 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
          Não iniciado
        </span>
      );
    }
    if (roundedValue === 100) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-accent border border-accent/30 bg-accent/10 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          Concluído
        </span>
      );
    }
    return null;
  };

  const remaining = totalLessons !== null && totalLessons !== undefined && totalLessons > 0
    ? Math.max(0, totalLessons - (completedLessons ?? Math.round((roundedValue / 100) * totalLessons)))
    : null;

  const renderSecondaryInfo = () => {
    if (roundedValue === 100) {
      return (
        <span className="text-xs text-accent tracking-tight font-medium">
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

    let relTime = formatRelativeTime(lastViewedAt ?? undefined);
    if (!relTime && lastStudiedDate) {
      relTime = formatRelativeDate(lastStudiedDate);
    }
    const lastWatchedText = relTime ? ` · última aula ${relTime}` : "";

    return (
      <span className="text-xs text-muted-foreground tracking-tight">
        {remainingText}{lastWatchedText}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {showTitle && (
        <div className="flex justify-between items-center w-full text-xs">
          <span className="text-muted-foreground font-medium tracking-wide">Seu progresso</span>
          <div className="flex items-center gap-1 text-foreground font-semibold tabular-nums tracking-tight">
            <span>{roundedValue}%</span>
            {estimatedFinishMonth && estimatedFinishMonth !== "sem previsão ainda" && roundedValue > 0 && roundedValue < 100 ? (
              <span className="text-muted-foreground font-normal">
                · termina em ~{estimatedFinishMonth}
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
