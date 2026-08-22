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
  
  const getStatusText = () => {
    if (roundedValue === 0) return "Não iniciado";
    if (roundedValue === 100) return "Concluído";
    return "Em andamento";
  };

  const getStatusColor = () => {
    if (roundedValue === 0) return "text-white/40 border-white/10 bg-white/5";
    if (roundedValue === 100) return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    return "text-[#29C5F6] border-[#007bff]/30 bg-[#007bff]/10 shadow-[0_0_10px_rgba(0,123,255,0.15)]";
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
          <span className={`tabular-nums text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border transition-all duration-300 ${getStatusColor()}`}>
            {getStatusText()}
          </span>

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
