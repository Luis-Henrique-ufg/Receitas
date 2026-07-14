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
          className="inline-flex flex-wrap gap-3 cursor-pointer font-medium text-xl items-center cursor-hover"
        >
          <Cookie className="w-8 h-8 text-[#007bff]" /> <span className="font-heading font-bold tracking-tighter">Receitas</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Button onClick={() => handleNavigate("/receitas")} variant="link">
            Meus cursos
          </Button>

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
