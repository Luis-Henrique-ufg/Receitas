import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playChimeSound } from "@/utils/sound";
import { statsApi } from "@/services/statsApi";
import { toast } from "sonner";
import { usePlaybackStore } from "./usePlaybackStore";

export type PomodoroMode = "focus" | "short_break" | "long_break";

export interface PomodoroDurations {
  focus: number; // minutes
  short_break: number; // minutes
  long_break: number; // minutes
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  sessionsCompleted: number;
  isMinimized: boolean;
  soundEnabled: boolean;
  autoPauseVideo: boolean;
  durations: PomodoroDurations;

  // Actions
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: (apiUrl?: string) => void;
  setMode: (mode: PomodoroMode) => void;
  tick: (apiUrl?: string) => void;
  toggleMinimized: () => void;
  toggleSound: () => void;
  toggleAutoPauseVideo: () => void;
  updateDurations: (newDurations: Partial<PomodoroDurations>) => void;
}

const DEFAULT_DURATIONS: PomodoroDurations = {
  focus: 25,
  short_break: 5,
  long_break: 15,
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      mode: "focus",
      timeLeft: DEFAULT_DURATIONS.focus * 60,
      isRunning: false,
      sessionsCompleted: 0,
      isMinimized: true,
      soundEnabled: true,
      autoPauseVideo: true,
      durations: DEFAULT_DURATIONS,

      start: () => set({ isRunning: true }),

      pause: () => set({ isRunning: false }),

      toggle: () => set((state) => ({ isRunning: !state.isRunning })),

      reset: () => {
        const { mode, durations } = get();
        set({
          isRunning: false,
          timeLeft: durations[mode] * 60,
        });
      },

      setMode: (mode: PomodoroMode) => {
        const { durations } = get();
        set({
          mode,
          isRunning: false,
          timeLeft: durations[mode] * 60,
        });
      },

      skip: (apiUrl?: string) => {
        const { mode, sessionsCompleted, durations } = get();
        let nextMode: PomodoroMode;
        let newSessions = sessionsCompleted;

        if (mode === "focus") {
          newSessions += 1;
          nextMode = newSessions % 4 === 0 ? "long_break" : "short_break";
          if (apiUrl) {
            void statsApi.recordPomodoro(apiUrl, durations.focus * 60);
          }
        } else {
          nextMode = "focus";
        }

        set({
          mode: nextMode,
          sessionsCompleted: newSessions,
          isRunning: false,
          timeLeft: durations[nextMode] * 60,
        });
      },

      tick: (apiUrl?: string) => {
        const state = get();
        if (!state.isRunning) return;

        if (state.timeLeft > 1) {
          set({ timeLeft: state.timeLeft - 1 });
        } else {
          // Timer finished!
          const { mode, sessionsCompleted, soundEnabled, autoPauseVideo, durations } = state;

          if (soundEnabled) {
            playChimeSound(mode === "focus" ? "complete" : "break");
          }

          if (mode === "focus") {
            const newSessions = sessionsCompleted + 1;
            const nextMode: PomodoroMode = newSessions % 4 === 0 ? "long_break" : "short_break";

            if (autoPauseVideo) {
              usePlaybackStore.getState().setIsPlaying(false);
              window.dispatchEvent(new CustomEvent("pomodoroPauseVideo"));
            }

            if (apiUrl) {
              void statsApi.recordPomodoro(apiUrl, durations.focus * 60);
            }

            toast.success("🍅 Ciclo de Foco Concluído!", {
              description: `Muito bem! Hora de descansar (${durations[nextMode]} min).`,
              duration: 5000,
            });

            set({
              mode: nextMode,
              sessionsCompleted: newSessions,
              isRunning: false,
              timeLeft: durations[nextMode] * 60,
            });
          } else {
            toast.info("☕ Pausa Concluída!", {
              description: "Pronto para o próximo ciclo de foco?",
              duration: 4000,
            });

            set({
              mode: "focus",
              isRunning: false,
              timeLeft: durations.focus * 60,
            });
          }
        }
      },

      toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleAutoPauseVideo: () => set((state) => ({ autoPauseVideo: !state.autoPauseVideo })),

      updateDurations: (newDurations: Partial<PomodoroDurations>) => {
        const current = get().durations;
        const updated = { ...current, ...newDurations };
        const mode = get().mode;
        set({
          durations: updated,
          timeLeft: updated[mode] * 60,
        });
      },
    }),
    {
      name: "receitas-pomodoro-store",
      partialize: (state) => ({
        durations: state.durations,
        soundEnabled: state.soundEnabled,
        autoPauseVideo: state.autoPauseVideo,
        sessionsCompleted: state.sessionsCompleted,
        isMinimized: state.isMinimized,
      }),
    }
  )
);
