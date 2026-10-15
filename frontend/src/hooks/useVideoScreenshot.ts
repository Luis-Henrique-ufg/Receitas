import { useCallback } from "react";

export function captureVideoScreenshot(
  video: HTMLVideoElement | null,
  filename?: string
): string | null {
  if (!video || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename || `screenshot_${Date.now()}.png`;
  a.click();

  return dataURL;
}

export function useVideoScreenshot() {
  const takeScreenshot = useCallback(
    (video: HTMLVideoElement | null, filename?: string) => {
      return captureVideoScreenshot(video, filename);
    },
    []
  );

  return { takeScreenshot };
}

export default useVideoScreenshot;
