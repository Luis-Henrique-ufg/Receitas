import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playChimeSound } from "@/utils/sound";
import { statsApi } from "@/services/statsApi";
import { toast } from "sonner";
import { usePlaybackStore } from "./usePlaybackStore";

export type PomodoroMode = "focus" | "short_break" | "long_break";
export type CompletionBehavior = "flow" | "strict" | "prompt";

export interface PomodoroDurations {
  focus: number; // minutes
  short_break: number; // minutes
  long_break: number; // minutes
}

export interface SessionSummary {
  durationMinutes: number;
  totalSeconds: number;
  pomodorosCount: number;
  subjectName?: string | null;
  timestamp: string;
}

export interface InactivityNotice {
  idleSeconds: number;
  idleSinceTime: string;
  totalElapsedSeconds: number;
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  isOvertime: boolean;
  overtimeSeconds: number;
  startedAt: number | null;
  initialFocusDuration: number;
  completionBehavior: CompletionBehavior;
  sessionsCompleted: number;
  isMinimized: boolean;
  soundEnabled: boolean;
  autoPauseVideo: boolean;
  durations: PomodoroDurations;
  currentCourseId?: number | null;
  currentCourseName?: string | null;
  currentSubjectId?: number | null;
  currentSubjectName?: string | null;

  // Inactivity tracking
  lastActiveAt: number;
  idleStartedAt: number | null;
  reminded50Min: boolean;
  reminded90Min: boolean;
  sessionSummary: SessionSummary | null;
  pendingInactivityNotice: InactivityNotice | null;

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
  setCompletionBehavior: (behavior: CompletionBehavior) => void;
  setCurrentCourse: (courseId?: number | null, courseName?: string | null) => void;
  setCurrentSubject: (subjectId?: number | null, subjectName?: string | null) => void;
  recordUserActivity: () => void;
  stopAndRecord: (apiUrl?: string, discountSeconds?: number) => Promise<void>;
  dismissSummary: () => void;
  resolveInactivity: (apiUrl: string | undefined, discount: boolean) => Promise<void>;
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
      isOvertime: false,
      overtimeSeconds: 0,
      startedAt: null,
      initialFocusDuration: DEFAULT_DURATIONS.focus * 60,
      completionBehavior: "flow",
      sessionsCompleted: 0,
      isMinimized: true,
      soundEnabled: true,
      autoPauseVideo: false, // Default false so video does not pause in flow mode
      durations: DEFAULT_DURATIONS,
      currentCourseId: null,
      currentCourseName: null,
      currentSubjectId: null,
      currentSubjectName: null,

      lastActiveAt: Date.now(),
      idleStartedAt: null,
      reminded50Min: false,
      reminded90Min: false,
      sessionSummary: null,
      pendingInactivityNotice: null,

      recordUserActivity: () => {
        set({ lastActiveAt: Date.now() });
      },

      start: () => {
        const { startedAt, timeLeft, initialFocusDuration, mode } = get();
        const now = Date.now();
        // If resuming or starting fresh
        let newStartedAt = startedAt;
        if (!newStartedAt) {
          if (mode === "focus") {
            const alreadyElapsed = Math.max(0, initialFocusDuration - timeLeft);
            newStartedAt = now - alreadyElapsed * 1000;
          } else {
            newStartedAt = now;
          }
        }
        set({
          isRunning: true,
          startedAt: newStartedAt,
          lastActiveAt: now,
        });
      },

      pause: () => {
        set({ isRunning: false });
      },

      toggle: () => {
        const { isRunning, start, pause } = get();
        if (isRunning) {
          pause();
        } else {
          start();
        }
      },

      reset: () => {
        const { mode, durations } = get();
        set({
          isRunning: false,
          isOvertime: false,
          overtimeSeconds: 0,
          startedAt: null,
          idleStartedAt: null,
          reminded50Min: false,
          reminded90Min: false,
          timeLeft: durations[mode] * 60,
          initialFocusDuration: durations[mode] * 60,
        });
      },

      setMode: (mode: PomodoroMode) => {
        const { durations } = get();
        set({
          mode,
          isRunning: false,
          isOvertime: false,
          overtimeSeconds: 0,
          startedAt: null,
          idleStartedAt: null,
          reminded50Min: false,
          reminded90Min: false,
          timeLeft: durations[mode] * 60,
          initialFocusDuration: durations[mode] * 60,
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
          isOvertime: false,
          overtimeSeconds: 0,
          startedAt: null,
          idleStartedAt: null,
          reminded50Min: false,
          reminded90Min: false,
          timeLeft: durations[nextMode] * 60,
          initialFocusDuration: durations[nextMode] * 60,
        });
      },

      stopAndRecord: async (apiUrl?: string, discountSeconds = 0) => {
        const {
          startedAt,
          initialFocusDuration,
          overtimeSeconds,
          isOvertime,
          durations,
          sessionsCompleted,
          currentCourseId,
          currentCourseName,
          currentSubjectId,
          currentSubjectName,
        } = get();

        // Total seconds computed
        const now = Date.now();
        const baseElapsed = startedAt
          ? Math.floor((now - startedAt) / 1000)
          : initialFocusDuration;
        const rawTotalSeconds = isOvertime
          ? initialFocusDuration + overtimeSeconds
          : baseElapsed;

        const effectiveSeconds = Math.max(
          60, // minimum 1 min recorded
          rawTotalSeconds - (discountSeconds || 0)
        );

        // Pomodoros calculated: total minutes / 25
        const earnedPomodoros = Math.max(
          1,
          Math.floor(effectiveSeconds / (durations.focus * 60))
        );

        // Record to backend
        try {
          await statsApi.recordPomodoro(
            apiUrl,
            effectiveSeconds,
            currentCourseId ?? undefined,
            currentCourseName ?? undefined,
            currentSubjectId ?? undefined,
            currentSubjectName ?? undefined,
            earnedPomodoros
          );
          window.dispatchEvent(new CustomEvent("statsUpdated"));
        } catch (err) {
          console.error("Erro ao gravar sessão de foco:", err);
        }

        const summary: SessionSummary = {
          durationMinutes: Math.round(effectiveSeconds / 60),
          totalSeconds: effectiveSeconds,
          pomodorosCount: earnedPomodoros,
          subjectName: currentSubjectName || "Sem matéria",
          timestamp: new Date().toISOString(),
        };

        const newSessions = sessionsCompleted + earnedPomodoros;

        set({
          isRunning: false,
          isOvertime: false,
          overtimeSeconds: 0,
          startedAt: null,
          idleStartedAt: null,
          reminded50Min: false,
          reminded90Min: false,
          timeLeft: durations.focus * 60,
          sessionsCompleted: newSessions,
          sessionSummary: summary,
          pendingInactivityNotice: null,
        });

        toast.success("🍅 Sessão de Foco Gravada!", {
          description: `${summary.durationMinutes} min · ${summary.pomodorosCount} ${
            summary.pomodorosCount === 1 ? "pomodoro" : "pomodoros"
          } · ${summary.subjectName}`,
          duration: 6000,
        });
      },

      dismissSummary: () => {
        set({ sessionSummary: null });
      },

      resolveInactivity: async (apiUrl: string | undefined, discount: boolean) => {
        const { pendingInactivityNotice, stopAndRecord } = get();
        const discountSecs =
          discount && pendingInactivityNotice
            ? pendingInactivityNotice.idleSeconds
            : 0;
        await stopAndRecord(apiUrl, discountSecs);
      },

      tick: (apiUrl?: string) => {
        const state = get();
        if (!state.isRunning) return;

        const {
          mode,
          startedAt,
          initialFocusDuration,
          completionBehavior,
          soundEnabled,
          autoPauseVideo,
          durations,
          currentCourseId,
          currentCourseName,
          currentSubjectId,
          currentSubjectName,
          sessionsCompleted,
          isOvertime,
          lastActiveAt,
          reminded50Min,
          reminded90Min,
        } = state;

        const now = Date.now();

        // 1. Break modes: standard countdown
        if (mode !== "focus") {
          if (state.timeLeft > 1) {
            set({ timeLeft: state.timeLeft - 1 });
          } else {
            // Break finished!
            if (soundEnabled) {
              playChimeSound("break");
            }
            toast.info("☕ Pausa Concluída!", {
              description: "Pronto para o próximo ciclo de foco?",
              duration: 4000,
            });
            set({
              mode: "focus",
              isRunning: false,
              isOvertime: false,
              overtimeSeconds: 0,
              startedAt: null,
              timeLeft: durations.focus * 60,
              initialFocusDuration: durations.focus * 60,
            });
          }
          return;
        }

        // 2. Focus mode: Timestamp-based calculation
        const effectiveStartedAt = startedAt || now;
        const totalElapsedSeconds = Math.floor(
          (now - effectiveStartedAt) / 1000
        );

        // Before 25:00
        if (totalElapsedSeconds < initialFocusDuration) {
          const remaining = initialFocusDuration - totalElapsedSeconds;
          set({
            timeLeft: remaining,
            isOvertime: false,
            overtimeSeconds: 0,
          });
          return;
        }

        // At or after initial duration (e.g. 25:00+)
        const overtime = totalElapsedSeconds - initialFocusDuration;

        // Crossing boundary into overtime for the very first time
        if (!isOvertime) {
          if (soundEnabled) {
            playChimeSound("complete");
          }

          // Browser native notification if supported and permitted
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("🍅 Pomodoro Cumprido!", {
                body: "25 minutos atingidos! Continuando em modo prolongamento contínuo.",
                icon: "/cookie.svg",
              });
            } catch {
              // benign notification error
            }
          }

          // If strict mode requested: pause and transition to break
          if (completionBehavior === "strict") {
            if (autoPauseVideo) {
              usePlaybackStore.getState().setIsPlaying(false);
              window.dispatchEvent(new CustomEvent("pomodoroPauseVideo"));
            }

            void statsApi
              .recordPomodoro(
                apiUrl,
                initialFocusDuration,
                currentCourseId ?? undefined,
                currentCourseName ?? undefined,
                currentSubjectId ?? undefined,
                currentSubjectName ?? undefined
              )
              .then(() => {
                window.dispatchEvent(new CustomEvent("statsUpdated"));
              })
              .catch((err) => console.error("Erro ao registrar pomodoro:", err));

            const newSessions = sessionsCompleted + 1;
            const nextMode: PomodoroMode =
              newSessions % 4 === 0 ? "long_break" : "short_break";

            toast.success("🍅 Ciclo de Foco Concluído!", {
              description: `Muito bem! Hora de descansar (${durations[nextMode]} min).`,
              duration: 5000,
            });

            set({
              mode: nextMode,
              sessionsCompleted: newSessions,
              isRunning: false,
              isOvertime: false,
              overtimeSeconds: 0,
              startedAt: null,
              timeLeft: durations[nextMode] * 60,
            });
            return;
          }

          // Default "flow" mode: video does NOT pause!
          toast.success("🍅 Pomodoro Cumprido!", {
            description:
              "25 minutos de foco atingidos! Continuando em modo prolongamento (+MM:SS).",
            duration: 4000,
          });
        }

        // In Overtime Flow:
        // Ghost time detection (inactivity):
        // If video is not playing and no mouse/keyboard interaction for > 5 min (300s)
        const isVideoPlaying = usePlaybackStore.getState().isPlaying;
        const inactiveDurationMs = now - lastActiveAt;
        let idleStart = state.idleStartedAt;

        if (!isVideoPlaying && inactiveDurationMs >= 5 * 60 * 1000) {
          if (!idleStart) {
            idleStart = lastActiveAt;
          }
        } else {
          // User was active
          idleStart = null;
        }

        // Gentle break reminders at 50 min and 90 min
        if (totalElapsedSeconds >= 50 * 60 && !reminded50Min) {
          toast.info("☕ 50 minutos de foco contínuo!", {
            description:
              "Você está em ótimo ritmo. Que tal planejar uma pausa de 5 min quando terminar?",
            duration: 5000,
          });
          set({ reminded50Min: true });
        }

        if (totalElapsedSeconds >= 90 * 60 && !reminded90Min) {
          toast.info("🌴 90 minutos de estudo intenso!", {
            description:
              "Pausas restauram o foco e auxiliam na consolidação da memória.",
            duration: 6000,
          });
          set({ reminded90Min: true });
        }

        // Update state
        set({
          timeLeft: 0,
          isOvertime: true,
          overtimeSeconds: overtime,
          idleStartedAt: idleStart,
        });
      },

      toggleMinimized: () =>
        set((state) => ({ isMinimized: !state.isMinimized })),

      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleAutoPauseVideo: () =>
        set((state) => ({ autoPauseVideo: !state.autoPauseVideo })),

      setCompletionBehavior: (behavior: CompletionBehavior) => {
        set({ completionBehavior: behavior });
      },

      updateDurations: (newDurations: Partial<PomodoroDurations>) => {
        const { durations, mode, isRunning } = get();
        const updated = { ...durations, ...newDurations };
        set({
          durations: updated,
          timeLeft: isRunning ? get().timeLeft : updated[mode] * 60,
          initialFocusDuration: updated[mode] * 60,
        });
      },

      setCurrentCourse: (
        courseId?: number | null,
        courseName?: string | null
      ) => {
        set({
          currentCourseId: courseId ?? null,
          currentCourseName: courseName ?? null,
        });
      },

      setCurrentSubject: (
        subjectId?: number | null,
        subjectName?: string | null
      ) => {
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
        completionBehavior: state.completionBehavior,
        sessionsCompleted: state.sessionsCompleted,
        currentCourseId: state.currentCourseId,
        currentCourseName: state.currentCourseName,
        currentSubjectId: state.currentSubjectId,
        currentSubjectName: state.currentSubjectName,
        // Persist startedAt and overtime so closing/reloading the tab preserves active flow!
        startedAt: state.startedAt,
        isRunning: state.isRunning,
        mode: state.mode,
        isOvertime: state.isOvertime,
        overtimeSeconds: state.overtimeSeconds,
      }),
    }
  )
);
