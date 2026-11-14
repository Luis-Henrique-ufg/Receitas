import Header from "@/components/header";
import CoursePage from "@/pages/course";
import SettingsPage from "@/pages/settings";
import CalendarPage from "@/pages/calendar";
import FocusPage from "@/pages/focus";
import AnalyticsPage from "@/pages/analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CoursesPage from "@/pages/courses";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import CommandPalette from "@/components/search/command-palette";
import PomodoroWidget from "@/components/pomodoro/pomodoro-widget";
import { useEffect, useState } from "react";
import usePlaybackStore from "@/store/usePlaybackStore";
import { cn } from "@/lib/utils";

export default function Router() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isZenMode = usePlaybackStore((state) => state.isZenMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        {!isZenMode && <Header onOpenSearch={() => setIsSearchOpen(true)} />}
        <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        {!isZenMode && <PomodoroWidget />}
        <Toaster
          position="bottom-left"
          richColors
          expand={false}
          visibleToasts={1}
        />
      </ThemeProvider>
      <main className={cn(isZenMode ? "p-0 relative z-10" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 relative z-10")}>
        <Routes>
          <Route path="/" element={<Navigate to="/receitas" replace />} />
          <Route path="/receitas/:courseId" element={<CoursePage />} />
          <Route path="/foco" element={<FocusPage />} />
          <Route path="/estatisticas" element={<AnalyticsPage />} />
          <Route path="/agenda" element={<CalendarPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
          <Route path="/receitas" element={<CoursesPage />} />
        </Routes>
      </main>
      {!isZenMode && <Footer />}
    </BrowserRouter>
  );
}
