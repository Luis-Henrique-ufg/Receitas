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
  currentCourseId?: number | null;
  currentCourseName?: string | null;
  currentSubjectId?: number | null;
  currentSubjectName?: string | null;

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
  setCurrentCourse: (courseId?: number | null, courseName?: string | null) => void;
  setCurrentSubject: (subjectId?: number | null, subjectName?: string | null) => void;
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
      currentCourseId: null,
      currentCourseName: null,
      currentSubjectId: null,
      currentSubjectName: null,

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
        const {
          mode,
          sessionsCompleted,
          durations,
          currentCourseId,
          currentCourseName,
          currentSubjectId,
          currentSubjectName,
        } = get();
        let nextMode: PomodoroMode;
        let newSessions = sessionsCompleted;

        if (mode === "focus") {
          newSessions += 1;
          nextMode = newSessions % 4 === 0 ? "long_break" : "short_break";
          const focusSecs = durations.focus * 60;
          void statsApi
            .recordPomodoro(
              apiUrl,
              focusSecs,
              currentCourseId ?? undefined,
              currentCourseName ?? undefined,
              currentSubjectId ?? undefined,
              currentSubjectName ?? undefined
            )
            .then(() => {
              window.dispatchEvent(new CustomEvent("statsUpdated"));
            })
            .catch((err) => console.error("Erro ao registrar pomodoro:", err));
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
          const {
            mode,
            sessionsCompleted,
            soundEnabled,
            autoPauseVideo,
            durations,
            currentCourseId,
            currentCourseName,
            currentSubjectId,
            currentSubjectName,
          } = state;

          if (soundEnabled) {
            playChimeSound(mode === "focus" ? "complete" : "break");
          }

          if (mode === "focus") {
            const newSessions = sessionsCompleted + 1;
            const nextMode: PomodoroMode = newSessions % 4 === 0 ? "long_break" : "short_break";
            const focusSecs = durations.focus * 60;

            if (autoPauseVideo) {
              usePlaybackStore.getState().setIsPlaying(false);
              window.dispatchEvent(new CustomEvent("pomodoroPauseVideo"));
            }

            void statsApi
              .recordPomodoro(
                apiUrl,
                focusSecs,
                currentCourseId ?? undefined,
                currentCourseName ?? undefined,
                currentSubjectId ?? undefined,
                currentSubjectName ?? undefined
              )
              .then(() => {
                window.dispatchEvent(new CustomEvent("statsUpdated"));
              })
              .catch((err) => console.error("Erro ao registrar pomodoro:", err));

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
        const { durations, mode, isRunning } = get();
        const updated = { ...durations, ...newDurations };
        set({
          durations: updated,
          timeLeft: isRunning ? get().timeLeft : updated[mode] * 60,
        });
      },

      setCurrentCourse: (courseId?: number | null, courseName?: string | null) => {
        set({
          currentCourseId: courseId ?? null,
          currentCourseName: courseName ?? null,
        });
      },

      setCurrentSubject: (subjectId?: number | null, subjectName?: string | null) => {
        set({
          currentSubjectId: subjectId ?? null,
          currentSubjectName: subjectName ?? null,
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
        currentCourseId: state.currentCourseId,
        currentCourseName: state.currentCourseName,
        currentSubjectId: state.currentSubjectId,
        currentSubjectName: state.currentSubjectName,
      }),
    }
  )
);
