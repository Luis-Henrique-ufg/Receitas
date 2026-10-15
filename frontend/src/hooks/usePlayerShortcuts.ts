import { useEffect } from "react";
import PlayerInstance from "video.js/dist/types/player";
import { toast } from "sonner";
import { usePlaybackStore } from "@/store/usePlaybackStore";

interface UsePlayerShortcutsOptions {
  playerRef: React.MutableRefObject<PlayerInstance | null>;
}

const AVAILABLE_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3];

export function usePlayerShortcuts({ playerRef }: UsePlayerShortcutsOptions) {
  const triggerNavigateNext = usePlaybackStore((state) => state.triggerNavigateNext);
  const triggerNavigatePrevious = usePlaybackStore(
    (state) => state.triggerNavigatePrevious
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea or select
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        return;
      }

      const player = playerRef.current;
      if (!player) {
        return;
      }

      const skipTime = 5;
      const jklTime = 10;

      // SHIFT Shortcuts
      if (e.shiftKey) {
        // Diminuir velocidade: SHIFT + <
        if (
          e.key === "<" ||
          e.key === "," ||
          (e.shiftKey && e.code === "Comma")
        ) {
          e.preventDefault();
          const currentRate = Number((player.playbackRate() || 1).toFixed(2));
          const nextRate =
            AVAILABLE_RATES.filter((r) => r < currentRate).pop() ?? 0.25;
          player.playbackRate(nextRate);
          toast.info(`Velocidade: ${nextRate}x`, {
            id: "playback-rate-toast",
            duration: 1000,
          });
          return;
        }

        // Aumentar velocidade: SHIFT + >
        if (
          e.key === ">" ||
          e.key === "." ||
          (e.shiftKey && e.code === "Period")
        ) {
          e.preventDefault();
          const currentRate = Number((player.playbackRate() || 1).toFixed(2));
          const nextRate =
            AVAILABLE_RATES.find((r) => r > currentRate) ?? 3;
          player.playbackRate(nextRate);
          toast.info(`Velocidade: ${nextRate}x`, {
            id: "playback-rate-toast",
            duration: 1000,
          });
          return;
        }

        // Vídeo anterior: SHIFT + P
        if (e.key.toLowerCase() === "p" || e.code === "KeyP") {
          e.preventDefault();
          triggerNavigatePrevious();
          return;
        }

        // Próximo vídeo: SHIFT + N
        if (e.key.toLowerCase() === "n" || e.code === "KeyN") {
          e.preventDefault();
          triggerNavigateNext();
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case "j":
          player.currentTime((player.currentTime() || 0) - jklTime);
          break;
        case "l":
          player.currentTime((player.currentTime() || 0) + jklTime);
          break;
        case "k":
        case " ":
          e.preventDefault();
          if (player.paused()) player.play();
          else player.pause();
          break;
        case "arrowleft":
          e.preventDefault();
          player.currentTime((player.currentTime() || 0) - skipTime);
          break;
        case "arrowright":
          e.preventDefault();
          player.currentTime((player.currentTime() || 0) + skipTime);
          break;
        case "arrowup":
          e.preventDefault();
          player.volume(Math.min((player.volume() || 0) + 0.1, 1));
          break;
        case "arrowdown":
          e.preventDefault();
          player.volume(Math.max((player.volume() || 0) - 0.1, 0));
          break;
        case "f":
          if (player.isFullscreen()) player.exitFullscreen();
          else player.requestFullscreen();
          break;
        case "m":
          player.muted(!player.muted());
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerRef, triggerNavigateNext, triggerNavigatePrevious]);
}

export default usePlayerShortcuts;
