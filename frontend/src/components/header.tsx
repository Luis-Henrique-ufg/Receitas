import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Header() {
  let navigate = useNavigate();

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
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            onClick={() => handleNavigate("/configuracoes")}
            variant="link"
          >
            Configurações
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Header;
