import FocusBarChart from "@/components/stats/focus-bar-chart";
import DashboardDeadlinesWidget from "@/components/calendar/dashboard-deadlines-widget";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-display font-medium text-foreground tracking-[-0.02em] leading-[1.15]">
              Estatísticas de Estudo
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Tempo de foco distribuído por matéria, metas periódicas e prazos acadêmicos
            </p>
          </div>
        </div>
      </div>

      {/* Stacked Focus Time Bar Chart by Subject */}
      <FocusBarChart />

      {/* Upcoming Deadlines Widget */}
      <DashboardDeadlinesWidget />
    </div>
  );
}
