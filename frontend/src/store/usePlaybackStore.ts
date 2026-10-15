import { create } from "zustand";

export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  seekTarget: number | null;
  lastCompleted: { lessonId: number; isCompleted: boolean } | null;
  navigationAction: "next" | "previous" | null;

  // Actions
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  seekTo: (time: number) => void;
  clearSeekTarget: () => void;
  markLessonCompleted: (lessonId: number, isCompleted?: boolean) => void;
  triggerNavigateNext: () => void;
  triggerNavigatePrevious: () => void;
  clearNavigationAction: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  seekTarget: null,
  lastCompleted: null,
  navigationAction: null,

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
    window.dispatchEvent(new CustomEvent("playerTimeUpdate", { detail: time }));
  },

  setDuration: (duration: number) => set({ duration }),

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  seekTo: (time: number) => {
    set({ seekTarget: time });
    window.dispatchEvent(new CustomEvent("playerSeek", { detail: time }));
  },

  clearSeekTarget: () => set({ seekTarget: null }),

  markLessonCompleted: (lessonId: number, isCompleted: boolean = true) => {
    set({ lastCompleted: { lessonId, isCompleted } });
    window.dispatchEvent(
      new CustomEvent("lessonCompleted", { detail: { lessonId, isCompleted } })
    );
  },

  triggerNavigateNext: () => {
    set({ navigationAction: "next" });
    window.dispatchEvent(new CustomEvent("playerNavigateNext"));
  },

  triggerNavigatePrevious: () => {
    set({ navigationAction: "previous" });
    window.dispatchEvent(new CustomEvent("playerNavigatePrevious"));
  },

  clearNavigationAction: () => set({ navigationAction: null }),
}));

export default usePlaybackStore;
