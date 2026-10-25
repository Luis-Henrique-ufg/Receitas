import { useEffect, useRef } from "react";
import videojs from "video.js";
import PlayerInstance from "video.js/dist/types/player";
import useApiUrl from "@/hooks/useApiUrl";
import { captureVideoScreenshot } from "@/hooks/useVideoScreenshot";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import { usePlayerShortcuts } from "@/hooks/usePlayerShortcuts";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import "./player.css";

interface PlayerProps {
  src: string;
  title?: string;
  isEnding?: (lessonId: number, isEnding: boolean) => void;
  lessonId: number;
  courseId?: number;
  courseName?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  timeElapsed: number;
}


const getSourceType = (url: string) => {
  if (url.includes(".m3u8")) return "application/x-mpegURL";
  return "video/mp4";
};

// Register custom screenshot button component in video.js
const VjsButton = videojs.getComponent("Button");

class ScreenshotButton extends VjsButton {
  constructor(player: PlayerInstance, options: Record<string, unknown>) {
    super(player, options);
    (this as unknown as { controlText: (text: string) => void }).controlText("Screenshot");
  }

  buildCSSClass() {
    return "vjs-screenshot-button vjs-control vjs-button";
  }

  handleClick() {
    const player = (this as unknown as { player: () => PlayerInstance }).player();
    const video = player.el()?.querySelector("video") as HTMLVideoElement | null;
    captureVideoScreenshot(video);
  }
}

if (!videojs.getComponent("ScreenshotButton")) {
  videojs.registerComponent("ScreenshotButton", ScreenshotButton);
}

export function Player({
  src,
  title,
  isEnding,
  lessonId,
  courseId,
  courseName,
  onTimeUpdate,
  onPlay,
  timeElapsed,
}: PlayerProps) {
  const videoNode = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerInstance | null>(null);
  const hasResumedRef = useRef(false);
  const currentActiveLessonIdRef = useRef(lessonId);
  const { apiUrl } = useApiUrl();

  const { handleTimeUpdate, forceSave, triggerCompletion, resetTracker } =
    useProgressTracker({
      lessonId,
      courseId,
      courseName,
      apiUrl,
      onTimeUpdate,
      isEnding,
    });


  usePlayerShortcuts({ playerRef });

  const seekTarget = usePlaybackStore((state) => state.seekTarget);
  const clearSeekTarget = usePlaybackStore((state) => state.clearSeekTarget);

  // Sync seekTarget from Zustand store
  useEffect(() => {
    if (seekTarget !== null && playerRef.current) {
      playerRef.current.currentTime(seekTarget);
      clearSeekTarget();
    }
  }, [seekTarget, clearSeekTarget]);

  // Backward compatibility: Listen to legacy window playerSeek event
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (playerRef.current && typeof customEvent.detail === "number") {
        playerRef.current.currentTime(customEvent.detail);
      }
    };
    window.addEventListener("playerSeek", handleSeek);
    return () => window.removeEventListener("playerSeek", handleSeek);
  }, []);

  // Initialize video.js instance
  useEffect(() => {
    if (videoNode.current && !playerRef.current) {
      playerRef.current = videojs(
        videoNode.current,
        {
          controls: true,
          autoplay: true,
          preload: "auto",
          fluid: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          userActions: {
            hotkeys: true,
          },
          sources: [{ src, type: getSourceType(src) }],
        },
        () => {
          const player = playerRef.current;
          if (player) {
            if (timeElapsed > 0) {
              player.currentTime(timeElapsed);
            }
            const controlBar = player.getChild("controlBar");
            if (controlBar) {
              controlBar.addChild(
                "ScreenshotButton",
                {},
                controlBar.children().length - 2
              );
            }
          }
        }
      );

      const player = playerRef.current;

      player.on("play", () => {
        if ((player.currentTime() || 0) > 1) {
          hasResumedRef.current = true;
        }
        if (onPlay) onPlay();
      });

      player.on("pause", () => {
        const currentTime = player.currentTime() || 0;
        forceSave(currentTime);
      });

      const onBeforeUnload = () => {
        const currentTime = player.currentTime() || 0;
        forceSave(currentTime);
      };
      window.addEventListener("beforeunload", onBeforeUnload);

      player.on("ended", () => {
        triggerCompletion();
      });

      player.on("timeupdate", () => {
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;

        if (currentTime > 1) {
          hasResumedRef.current = true;
        }

        handleTimeUpdate(currentTime, duration);
      });
    }

    return () => {
      const player = playerRef.current;
      if (player) {
        const currentTime = player.currentTime() || 0;
        forceSave(currentTime);

        if (!player.isDisposed()) {
          player.dispose();
          playerRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update src when lesson changes
  useEffect(() => {
    const player = playerRef.current;
    if (player && src) {
      if (currentActiveLessonIdRef.current !== lessonId) {
        currentActiveLessonIdRef.current = lessonId;
        hasResumedRef.current = false;
        resetTracker();
        player.src({ src, type: getSourceType(src) });

        player.one("loadedmetadata", () => {
          if (timeElapsed > 0 && !hasResumedRef.current) {
            player.currentTime(timeElapsed);
            hasResumedRef.current = true;
          }
        });

        player.play()?.catch((e) => console.log("Auto-play prevented", e));
      }
    }
  }, [src, lessonId, timeElapsed, resetTracker]);

  // Sync elapsed time after async fetch
  useEffect(() => {
    const player = playerRef.current;
    if (player && timeElapsed > 0 && !hasResumedRef.current) {
      const currentPos = player.currentTime() || 0;
      if (currentPos < 1) {
        const duration = player.duration();
        if (typeof duration === "number" && !isNaN(duration) && duration > 0) {
          player.currentTime(timeElapsed);
          hasResumedRef.current = true;
        }
      } else {
        hasResumedRef.current = true;
      }
    }
  }, [timeElapsed]);

  return (
    <div
      aria-label={title || "Video Player"}
      className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-xl glass-panel relative transition-all duration-500"
    >
      <div data-vjs-player className="w-full h-full">
        <video
          ref={videoNode}
          crossOrigin="anonymous"
          className="video-js vjs-default-skin vjs-big-play-centered w-full h-full"
        />
      </div>
    </div>
  );
}

export default Player;
