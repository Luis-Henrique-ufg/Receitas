import { useRef, useCallback, useEffect } from "react";
import { completeLesson } from "@/services/videoPlayer";
import { usePlaybackStore } from "@/store/usePlaybackStore";

interface ProgressTrackerOptions {
  lessonId: number;
  apiUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  isEnding?: (lessonId: number, isEnding: boolean) => void;
}

export function useProgressTracker({
  lessonId,
  apiUrl,
  onTimeUpdate,
  isEnding,
}: ProgressTrackerOptions) {
  const lastSavedTimeRef = useRef(0);
  const isEndingTriggeredRef = useRef(false);

  const optionsRef = useRef({ lessonId, apiUrl, onTimeUpdate, isEnding });
  useEffect(() => {
    optionsRef.current = { lessonId, apiUrl, onTimeUpdate, isEnding };
  }, [lessonId, apiUrl, onTimeUpdate, isEnding]);

  const setCurrentTimeStore = usePlaybackStore((state) => state.setCurrentTime);
  const setDurationStore = usePlaybackStore((state) => state.setDuration);
  const markLessonCompletedStore = usePlaybackStore(
    (state) => state.markLessonCompleted
  );

  const triggerCompletion = useCallback(async () => {
    if (isEndingTriggeredRef.current) {
      return;
    }
    isEndingTriggeredRef.current = true;

    const {
      lessonId: currentLessonId,
      apiUrl: currentApiUrl,
      isEnding: currentIsEnding,
    } = optionsRef.current;

    markLessonCompletedStore(currentLessonId, true);

    await completeLesson(currentApiUrl, currentLessonId);
    if (currentIsEnding) {
      currentIsEnding(currentLessonId, true);
    }
  }, [markLessonCompletedStore]);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (duration <= 0) {
        return;
      }

      setCurrentTimeStore(currentTime);
      setDurationStore(duration);

      const currentSec = Math.floor(currentTime);
      const lastSec = Math.floor(lastSavedTimeRef.current);

      const { onTimeUpdate: currentOnTimeUpdate } = optionsRef.current;

      // Save every 10 seconds after 10s elapsed
      if (
        currentOnTimeUpdate &&
        currentSec % 10 === 0 &&
        currentSec > 10 &&
        currentSec !== lastSec
      ) {
        currentOnTimeUpdate(currentSec);
        lastSavedTimeRef.current = currentSec;
      }

      // Check 95% completion threshold
      const percent = currentTime / duration;
      if (percent >= 0.95 && !isEndingTriggeredRef.current && currentTime > 0) {
        void triggerCompletion();
      } else if (percent < 0.95) {
        isEndingTriggeredRef.current = false;
      }
    },
    [setCurrentTimeStore, setDurationStore, triggerCompletion]
  );

  const forceSave = useCallback((currentTime: number) => {
    const { onTimeUpdate: currentOnTimeUpdate } = optionsRef.current;
    if (currentOnTimeUpdate && currentTime > 0) {
      const sec = Math.floor(currentTime);
      currentOnTimeUpdate(sec);
      lastSavedTimeRef.current = sec;
    }
  }, []);

  const resetTracker = useCallback(() => {
    isEndingTriggeredRef.current = false;
    lastSavedTimeRef.current = 0;
  }, []);

  return {
    handleTimeUpdate,
    forceSave,
    triggerCompletion,
    resetTracker,
  };
}

export default useProgressTracker;
