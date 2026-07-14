import Header from "@/components/header";
import CoursePage from "@/pages/course";

import HomeScreen from "@/pages/home";

import SettingsPage from "@/pages/settings";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import CoursesPage from "@/pages/courses";
import Footer from "@/components/footer";

import { useEffect } from "react";

type Props = {};

export default function Router({}: Props) {
  useEffect(() => {
    const cursor = document.getElementById("cursor");
    if (!cursor) return;
    
    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('.video-js')) {
        cursor.style.opacity = '0';
      } else {
        cursor.style.opacity = '';
      }

      if (
        target.tagName.toLowerCase() === 'button' || 
        target.tagName.toLowerCase() === 'a' || 
        target.closest('button') || 
        target.closest('a') || 
        target.classList.contains('cursor-hover') ||
        target.closest('.cursor-hover')
      ) {
        cursor.classList.add('hovered');
      } else {
        cursor.classList.remove('hovered');
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Liquid Glass Background */}
      <div id="cursor" className="hidden md:block"></div>
      <div className="noise-overlay"></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="liquid-blob bg-[#007bff]" style={{width: '500px', height: '500px', top: '-100px', left: '-100px', opacity: 0.2, animationDuration: '15s'}}></div>
        <div className="liquid-blob bg-purple-600" style={{width: '400px', height: '400px', top: '40%', right: '-100px', opacity: 0.15, animationDuration: '20s', animationDelay: '-5s'}}></div>
        <div className="liquid-blob bg-cyan-600" style={{width: '600px', height: '600px', bottom: '-150px', left: '20%', opacity: 0.15, animationDuration: '25s', animationDelay: '-10s'}}></div>
      </div>

      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Header />
        <Toaster
          position="bottom-right"
          richColors
          expand={false}
          visibleToasts={1}
        />
      </ThemeProvider>
      <main className="p-6 pt-28 relative z-10">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/receitas/:courseId" element={<CoursePage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/receitas" element={<CoursesPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
