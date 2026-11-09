import { create } from "zustand";
import {
  PlaybackPhase,
  resolvePlaybackPhase,
  playbackQueries,
} from "@/machines/playbackMachine";

export type { PlaybackPhase };
export { playbackQueries };

export interface PlaybackState {
  phase: PlaybackPhase;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  seekTarget: number | null;
  lastCompleted: { lessonId: number; isCompleted: boolean } | null;
  navigationAction: "next" | "previous" | null;
  isZenMode: boolean;

  // Actions
  getPhase: () => PlaybackPhase;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  seekTo: (time: number) => void;
  clearSeekTarget: () => void;
  markLessonCompleted: (lessonId: number, isCompleted?: boolean) => void;
  triggerNavigateNext: () => void;
  triggerNavigatePrevious: () => void;
  clearNavigationAction: () => void;
  toggleZenMode: (val?: boolean) => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  phase: "unloaded",
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  seekTarget: null,
  lastCompleted: null,
  navigationAction: null,
  isZenMode: false,

  getPhase: () => {
    const s = get();
    return resolvePlaybackPhase({
      hasSource: s.duration > 0 || s.currentTime > 0,
      isPlaying: s.isPlaying,
      isSeeking: s.seekTarget !== null,
      isCompleting: s.lastCompleted !== null && s.lastCompleted.isCompleted,
      isNavigating: s.navigationAction !== null,
    });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
    window.dispatchEvent(new CustomEvent("playerTimeUpdate", { detail: time }));
  },

  setDuration: (duration: number) => {
    set((state) => ({
      duration,
      phase: duration > 0 ? (state.isPlaying ? "playing" : "ready_paused") : "unloaded",
    }));
  },

  setIsPlaying: (isPlaying: boolean) => {
    set((state) => ({
      isPlaying,
      phase: isPlaying ? "playing" : state.duration > 0 ? "ready_paused" : "unloaded",
    }));
  },

  seekTo: (time: number) => {
    set({ seekTarget: time, phase: "seeking" });
    window.dispatchEvent(new CustomEvent("playerSeek", { detail: time }));
  },

  clearSeekTarget: () => {
    set((state) => ({
      seekTarget: null,
      phase: state.isPlaying ? "playing" : "ready_paused",
    }));
  },

  markLessonCompleted: (lessonId: number, isCompleted: boolean = true) => {
    set({
      lastCompleted: { lessonId, isCompleted },
      phase: isCompleted ? "completing" : "ready_paused",
    });
    window.dispatchEvent(
      new CustomEvent("lessonCompleted", { detail: { lessonId, isCompleted } })
    );
  },

  triggerNavigateNext: () => {
    set({ navigationAction: "next", phase: "navigating" });
    window.dispatchEvent(new CustomEvent("playerNavigateNext"));
  },

  triggerNavigatePrevious: () => {
    set({ navigationAction: "previous", phase: "navigating" });
    window.dispatchEvent(new CustomEvent("playerNavigatePrevious"));
  },

  clearNavigationAction: () => {
    set((state) => ({
      navigationAction: null,
      phase: state.isPlaying ? "playing" : "ready_paused",
    }));
  },

  toggleZenMode: (val?: boolean) => {
    set((state) => ({ isZenMode: val !== undefined ? val : !state.isZenMode }));
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 50);
  },
}));

export default usePlaybackStore;
