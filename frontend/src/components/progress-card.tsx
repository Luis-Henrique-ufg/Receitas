import { Progress } from "./ui/progress";

type Props = {
  value?: number;
  hideValue?: boolean;
  totalLessons?: number | null;
  completedLessons?: number | null;
  showTitle?: boolean;
};

export default function ProgressCard({
  value = 0,
  hideValue = false,
  totalLessons,
  completedLessons,
  showTitle = true,
}: Props) {
  const roundedValue = Math.round(Number(value) || 0);
  
  const getStatusBadge = () => {
    if (roundedValue === 0) {
      return (
        <span className="glass-panel px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white/50 border border-white/5 bg-white/[0.02] inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
          Não iniciado
        </span>
      );
    }
    if (roundedValue === 100) {
      return (
        <span className="glass-panel px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white/90 border border-white/15 bg-white/[0.06] inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#29C5F6] shrink-0" />
          Concluído
        </span>
      );
    }
    return (
      <span className="glass-panel px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white/90 border border-white/10 bg-white/[0.04] inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#007bff] shrink-0" />
        Em andamento
      </span>
    );
  };

  const remaining = totalLessons !== null && totalLessons !== undefined && totalLessons > 0
    ? Math.max(0, totalLessons - (completedLessons ?? Math.round((roundedValue / 100) * totalLessons)))
    : null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {showTitle && (
        <div className="flex justify-between items-center w-full text-xs">
          <span className="text-white/60 font-medium tracking-wide">Seu progresso</span>
          <span className="font-semibold text-white tabular-nums tracking-tight">
            {roundedValue}% concluído
          </span>
        </div>
      )}

      <Progress value={roundedValue} className="h-2" />

      {!hideValue && (
        <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
          {getStatusBadge()}

          {totalLessons !== null && totalLessons !== undefined && totalLessons > 0 && (
            <span className="text-xs text-white/50 tracking-tight">
              {roundedValue === 100
                ? `Todas as ${totalLessons} aulas concluídas!`
                : `${remaining} de ${totalLessons} ${totalLessons === 1 ? "aula restante" : "aulas restantes"}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
