import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      title={theme === "light" ? "Alternar para modo escuro" : "Alternar para modo claro"}
    >
      {theme === "light" ? (
        <Sun className="h-4 w-4 text-primary transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-accent transition-all" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
