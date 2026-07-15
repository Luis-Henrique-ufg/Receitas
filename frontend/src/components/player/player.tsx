import React, { useEffect, useRef, useState, useCallback } from "react";
import videojs from "video.js";
import PlayerInstance from "video.js/dist/types/player";
import { completeLesson } from "@/services/videoPlayer";
import useApiUrl from "@/hooks/useApiUrl";

import "./player.css"; // Custom styling for video.js

interface PlayerProps {
  src: string;
  title: string;
  isEnding?: (lessonId: number, isEnding: boolean) => void;
  lessonId: number;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  timeElapsed: number;
}

const getSourceType = (url: string) => {
  if (url.includes(".m3u8")) return "application/x-mpegURL";
  return "video/mp4";
};

// Register custom components in video.js
const Button = videojs.getComponent("Button");

class ScreenshotButton extends Button {
  constructor(player: any, options: any) {
    super(player, options);
    this.controlText("Screenshot");
  }
  buildCSSClass() {
    return `vjs-screenshot-button vjs-control vjs-button`;
  }
  handleClick() {
    const video = this.player().el().querySelector("video");
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `screenshot_${Date.now()}.png`;
    a.click();
  }
}

// Only register once
if (!videojs.getComponent("ScreenshotButton")) {
  videojs.registerComponent("ScreenshotButton", ScreenshotButton);
}

export function Player({
  src,
  title,
  isEnding,
  lessonId,
  onTimeUpdate,
  onPlay,
  timeElapsed,
}: PlayerProps) {
  const videoNode = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerInstance | null>(null);
  const lastElapsedTimeSavedRef = useRef(timeElapsed);
  const isEndingTriggeredRef = useRef(false);
  const hasResumedRef = useRef(false);
  const { apiUrl } = useApiUrl();

  const latestProps = useRef({ lessonId, isEnding, apiUrl, onTimeUpdate });
  useEffect(() => {
    latestProps.current = { lessonId, isEnding, apiUrl, onTimeUpdate };
  }, [lessonId, isEnding, apiUrl, onTimeUpdate]);

  useEffect(() => {
    // Initialize video.js
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
            hotkeys: true // native basic hotkeys (f, m)
          },
          sources: [{ src, type: getSourceType(src) }],
        },
        () => {
          // Player is ready
          const player = playerRef.current;
          if (player) {
            if (timeElapsed > 0) {
              player.currentTime(timeElapsed);
            }
            // Add custom buttons to control bar
            const controlBar = player.getChild("controlBar");
            if (controlBar) {
              controlBar.addChild("ScreenshotButton", {}, controlBar.children().length - 2);
            }
          }
        }
      );

      const player = playerRef.current;

      const forceSaveProgress = () => {
        const currentTime = player.currentTime() || 0;
        const { onTimeUpdate: currentOnTimeUpdate } = latestProps.current;
        if (currentOnTimeUpdate && currentTime > 0) {
          currentOnTimeUpdate(Math.floor(currentTime));
          lastElapsedTimeSavedRef.current = Math.floor(currentTime);
        }
      };

      player.on("play", () => {
        if (onPlay) onPlay();
      });

      player.on("pause", () => {
        forceSaveProgress();
      });

      window.addEventListener("beforeunload", forceSaveProgress);

      player.on("timeupdate", () => {
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;

        if (duration === 0) return;

        // Custom event for external listeners
        window.dispatchEvent(
          new CustomEvent("playerTimeUpdate", { detail: currentTime })
        );

        const { lessonId: currentLessonId, isEnding: currentIsEnding, apiUrl: currentApiUrl, onTimeUpdate: currentOnTimeUpdate } = latestProps.current;

        // Progress saving (every 10 seconds)
        const currentSecondsElapsed = Math.floor(currentTime);
        const lastedSavedSeconds = Math.floor(lastElapsedTimeSavedRef.current);
        if (
          currentOnTimeUpdate &&
          currentSecondsElapsed % 10 === 0 &&
          currentTime > 10 &&
          currentSecondsElapsed !== lastedSavedSeconds
        ) {
          currentOnTimeUpdate(Math.floor(currentTime));
          lastElapsedTimeSavedRef.current = Math.floor(currentTime);
        }

        // Completion logic at 95%
        const percent = currentTime / duration;
        if (percent >= 0.95 && !isEndingTriggeredRef.current && currentTime > 0) {
          isEndingTriggeredRef.current = true;
          completeLesson(currentApiUrl, currentLessonId).then(() => {
            if (currentIsEnding) {
              currentIsEnding(currentLessonId, true);
            }
          });
        } else if (percent < 0.95) {
          isEndingTriggeredRef.current = false;
        }
      });
    }

    // Cleanup when component unmounts
    return () => {
      const player = playerRef.current;
      if (player) {
        const currentTime = player.currentTime() || 0;
        const { onTimeUpdate: currentOnTimeUpdate } = latestProps.current;
        if (currentOnTimeUpdate && currentTime > 0) {
          currentOnTimeUpdate(Math.floor(currentTime));
        }

        // Remover o listener global caso o player existisse
        const forceSaveProgress = () => {
          if (currentOnTimeUpdate && currentTime > 0) {
            currentOnTimeUpdate(Math.floor(currentTime));
          }
        };
        window.removeEventListener("beforeunload", forceSaveProgress);

        if (!player.isDisposed()) {
          player.dispose();
          playerRef.current = null;
        }
      }
    };
  }, []); // Run once on mount

  // Watch for src changes to load new video
  useEffect(() => {
    const player = playerRef.current;
    if (player && src) {
      hasResumedRef.current = false; // Reset resume flag for new video
      player.src({ src, type: getSourceType(src) });
      
      // Wait for video to load metadata before seeking
      player.one('loadedmetadata', () => {
        if (timeElapsed > 0 && !hasResumedRef.current) {
          player.currentTime(timeElapsed);
          lastElapsedTimeSavedRef.current = timeElapsed;
          hasResumedRef.current = true;
        }
      });
      
      isEndingTriggeredRef.current = false;
      player.play().catch((e) => console.log("Auto-play prevented", e));
    }
  }, [src, lessonId]);

  // Update current time if fetched from API later
  useEffect(() => {
    const player = playerRef.current;
    if (player && timeElapsed > 0 && !hasResumedRef.current) {
      const duration = player.duration();
      // If metadata is loaded and we haven't resumed yet
      if (!isNaN(duration) && duration > 0) {
        player.currentTime(timeElapsed);
        lastElapsedTimeSavedRef.current = timeElapsed;
        hasResumedRef.current = true;
      }
    }
  }, [timeElapsed]);

  // Global Keyboard Shortcuts (J, K, L, Space, Arrows, M, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const player = playerRef.current;
      if (!player) return;

      const skipTime = 5; // 5 seconds for arrows
      const jklTime = 10; // 10 seconds for J/L

      switch (e.key.toLowerCase()) {
        case "j":
          player.currentTime((player.currentTime() || 0) - jklTime);
          break;
        case "l":
          player.currentTime((player.currentTime() || 0) + jklTime);
          break;
        case "k":
        case " ":
          e.preventDefault(); // prevent page scroll on spacebar
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
  }, []);

  // Custom Seek Listener from elsewhere in the app
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (playerRef.current) {
        playerRef.current.currentTime(customEvent.detail);
      }
    };
    window.addEventListener("playerSeek", handleSeek);
    return () => window.removeEventListener("playerSeek", handleSeek);
  }, []);

  return (
    <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-xl glass-panel relative transition-all duration-500">
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
