import { Calendar, Cookie, Search } from "lucide-react";
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
    <nav className="fixed w-full z-[60] top-0 transition-all duration-300 py-3 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-full px-5 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo - pure typography + gradient icon (no inner pill container) */}
        <div
          onClick={() => handleNavigate("/")}
          className="cursor-hover group flex items-center gap-2.5 cursor-pointer select-none py-0.5"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#29C5F6] to-[#3a4b9f] flex items-center justify-center shadow-[0_4px_10px_rgba(41,197,246,0.3)] group-hover:scale-105 transition-transform duration-300">
            <Cookie className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tighter text-white">Receitas</span>
        </div>

        {/* Navigation Items & Search */}
        <div className="flex items-center gap-2 sm:gap-4">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="cursor-hover hidden sm:flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>Buscar</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/10 ml-0.5 lowercase">
                ctrl k
              </kbd>
            </button>
          )}

          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="cursor-hover sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              title="Buscar (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-zinc-300" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNavigate("/agenda")}
            className="cursor-hover text-xs font-medium uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("/configuracoes")}
            className="cursor-hover text-xs font-medium uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors"
          >
            Configurações
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Header;
