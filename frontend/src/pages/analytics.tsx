import FocusBarChart from "@/components/stats/focus-bar-chart";
import DashboardDeadlinesWidget from "@/components/calendar/dashboard-deadlines-widget";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="w-full mb-4 space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-400 shrink-0" />
            <span>Estatísticas de Estudo</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tempo de foco distribuído por matéria, metas periódicas e prazos acadêmicos.
          </p>
        </div>
      </div>

      {/* Stacked Focus Time Bar Chart by Subject */}
      <FocusBarChart />

      {/* Upcoming Deadlines Widget */}
      <DashboardDeadlinesWidget />
    </div>
  );
}

