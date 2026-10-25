import { useRef, useCallback, useEffect } from "react";
import { completeLesson } from "@/services/videoPlayer";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { statsApi } from "@/services/statsApi";

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
  const lastPlaybackSecRef = useRef<number | null>(null);
  const accumulatedStudySecondsRef = useRef<number>(0);

  const optionsRef = useRef({ lessonId, apiUrl, onTimeUpdate, isEnding });
  useEffect(() => {
    optionsRef.current = { lessonId, apiUrl, onTimeUpdate, isEnding };
  }, [lessonId, apiUrl, onTimeUpdate, isEnding]);

  const setCurrentTimeStore = usePlaybackStore((state) => state.setCurrentTime);
  const setDurationStore = usePlaybackStore((state) => state.setDuration);
  const markLessonCompletedStore = usePlaybackStore(
    (state) => state.markLessonCompleted
  );

  const flushStudyTime = useCallback(() => {
    const toSend = Math.floor(accumulatedStudySecondsRef.current);
    if (toSend > 0) {
      accumulatedStudySecondsRef.current -= toSend;
      void statsApi
        .recordHeartbeat(optionsRef.current.apiUrl, toSend)
        .then(() => {
          window.dispatchEvent(new CustomEvent("statsUpdated"));
        })
        .catch((err) => console.error("Erro ao registrar tempo de estudo:", err));
    }
    lastPlaybackSecRef.current = null;
  }, []);

  const triggerCompletion = useCallback(async () => {
    if (isEndingTriggeredRef.current) {
      return;
    }
    isEndingTriggeredRef.current = true;

    flushStudyTime();

    const {
      lessonId: currentLessonId,
      apiUrl: currentApiUrl,
      isEnding: currentIsEnding,
    } = optionsRef.current;

    markLessonCompletedStore(currentLessonId, true);

    await completeLesson(currentApiUrl, currentLessonId);
    window.dispatchEvent(new CustomEvent("statsUpdated"));

    if (currentIsEnding) {
      currentIsEnding(currentLessonId, true);
    }
  }, [markLessonCompletedStore, flushStudyTime]);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (duration <= 0) {
        return;
      }

      setCurrentTimeStore(currentTime);
      setDurationStore(duration);

      const currentSec = Math.floor(currentTime);
      const lastSec = Math.floor(lastSavedTimeRef.current);

      // Track study time heartbeat: delta between playback ticks
      if (lastPlaybackSecRef.current !== null) {
        const delta = currentTime - lastPlaybackSecRef.current;
        // Normal playback progression (delta between 0 and 3 seconds)
        if (delta > 0 && delta < 3) {
          accumulatedStudySecondsRef.current += delta;
        }
      }
      lastPlaybackSecRef.current = currentTime;

      // Periodically flush study seconds if >= 5 seconds accumulated
      if (accumulatedStudySecondsRef.current >= 5) {
        const toSend = Math.floor(accumulatedStudySecondsRef.current);
        accumulatedStudySecondsRef.current -= toSend;
        void statsApi
          .recordHeartbeat(optionsRef.current.apiUrl, toSend)
          .then(() => {
            window.dispatchEvent(new CustomEvent("statsUpdated"));
          })
          .catch((err) => console.error("Erro ao registrar tempo de estudo:", err));
      }

      const { onTimeUpdate: currentOnTimeUpdate } = optionsRef.current;

      // Save watched lesson progress every 10 seconds after 10s elapsed
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

  const forceSave = useCallback(
    (currentTime: number) => {
      flushStudyTime();
      const { onTimeUpdate: currentOnTimeUpdate } = optionsRef.current;
      if (currentOnTimeUpdate && currentTime > 0) {
        const sec = Math.floor(currentTime);
        currentOnTimeUpdate(sec);
        lastSavedTimeRef.current = sec;
      }
    },
    [flushStudyTime]
  );

  const resetTracker = useCallback(() => {
    flushStudyTime();
    isEndingTriggeredRef.current = false;
    lastSavedTimeRef.current = 0;
    lastPlaybackSecRef.current = null;
    accumulatedStudySecondsRef.current = 0;
  }, [flushStudyTime]);

  return {
    handleTimeUpdate,
    forceSave,
    triggerCompletion,
    resetTracker,
  };
}

export default useProgressTracker;

