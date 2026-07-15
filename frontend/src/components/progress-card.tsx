import { number } from "zod";
import { Progress } from "./ui/progress";

type Props = {
  value?: number;
  hideValue?: boolean;
};

export default function ProgressCard({ value = 0, hideValue = false }: Props) {
  const roundedValue = Math.round(Number(value) || 0);
  
  const getStatusText = () => {
    if (roundedValue === 0) return "Não Iniciado";
    if (roundedValue === 100) return "Concluído";
    return `Em Andamento (${roundedValue}%)`;
  };

  const getStatusColor = () => {
    if (roundedValue === 0) return "text-white/40 border-white/10";
    if (roundedValue === 100) return "text-emerald-400 border-emerald-400/20 bg-emerald-400/10";
    return "text-[#007bff] border-[#007bff]/20 bg-[#007bff]/10";
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <Progress value={roundedValue} className="h-1.5 opacity-80" />
      {!hideValue && (
        <span className={`tabular-nums text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
