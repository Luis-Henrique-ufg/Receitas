import { Calendar, Cookie, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onOpenSearch?: () => void;
}

function Header({ onOpenSearch }: HeaderProps) {
  const navigate = useNavigate();

  function handleNavigate(path: string) {
    navigate(path);
  }

  return (
    <nav className="fixed w-full z-[60] top-0 transition-all duration-300 py-4 px-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-full px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div
          onClick={() => handleNavigate("/")}
          className="glass-panel glass-panel-hover px-4 py-2 rounded-full inline-flex items-center gap-2.5 cursor-pointer font-medium text-xl cursor-hover group border border-white/10 select-none"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007bff] to-[#00bfff] flex items-center justify-center shadow-[0_4px_10px_rgba(0,123,255,0.4)] group-hover:scale-110 transition-transform duration-300">
            <Cookie className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold tracking-tighter text-white">Receitas</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {onOpenSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSearch}
              className="glass-panel glass-panel-hover rounded-full px-3.5 py-1.5 h-9 text-xs text-white/70 hover:text-white border-white/10 gap-2 font-normal hidden sm:inline-flex items-center"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Buscar...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/10 ml-1">
                Ctrl K
              </kbd>
            </Button>
          )}

          {onOpenSearch && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenSearch}
              className="glass-panel glass-panel-hover rounded-full w-9 h-9 sm:hidden text-white/70 hover:text-white border-white/10"
              title="Buscar (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-zinc-300" />
            </Button>
          )}

          <Button
            onClick={() => handleNavigate("/agenda")}
            variant="link"
            className="text-white/80 hover:text-white flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Agenda</span>
          </Button>

          <Button
            onClick={() => handleNavigate("/configuracoes")}
            variant="link"
            className="text-white/80 hover:text-white"
          >
            Configurações
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Header;

