import Header from "@/components/header";
import CoursePage from "@/pages/course";
import SettingsPage from "@/pages/settings";
import CalendarPage from "@/pages/calendar";
import FocusPage from "@/pages/focus";
import AnalyticsPage from "@/pages/analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import CoursesPage from "@/pages/courses";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import CommandPalette from "@/components/search/command-palette";
import PomodoroWidget from "@/components/pomodoro/pomodoro-widget";
import { useEffect, useState } from "react";
import usePlaybackStore from "@/store/usePlaybackStore";
import { cn } from "@/lib/utils";

function AppLayout({
  isSearchOpen,
  setIsSearchOpen,
}: {
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isZenMode = usePlaybackStore((state) => state.isZenMode);
  const location = useLocation();
  const isCoursePlayer = /^\/receitas\/[^/]+/.test(location.pathname);

  return (
    <>
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
      <main
        className={cn(
          isZenMode
            ? "p-0 relative z-10"
            : isCoursePlayer
            ? "w-full max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-4 relative z-10"
            : "w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-16 relative z-10"
        )}
      >
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
      {!isZenMode && !isCoursePlayer && <Footer />}
    </>
  );
}

export default function Router() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      <AppLayout isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
    </BrowserRouter>
  );
}
