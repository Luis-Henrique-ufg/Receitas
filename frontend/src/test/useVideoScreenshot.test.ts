import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureVideoScreenshot, useVideoScreenshot } from "@/hooks/useVideoScreenshot";
import { renderHook } from "@testing-library/react";

describe("useVideoScreenshot and captureVideoScreenshot", () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("returns null when video element is null or has zero dimensions", () => {
    expect(captureVideoScreenshot(null)).toBeNull();

    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 0 });
    Object.defineProperty(video, "videoHeight", { value: 0 });
    expect(captureVideoScreenshot(video)).toBeNull();
  });

  it("captures screenshot when video has valid dimensions", () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 1920 });
    Object.defineProperty(video, "videoHeight", { value: 1080 });

    const mockDrawImage = vi.fn();
    const mockToDataURL = vi.fn().mockReturnValue("data:image/png;base64,mocked");

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: mockDrawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(mockToDataURL);

    const { result } = renderHook(() => useVideoScreenshot());
    const res = result.current.takeScreenshot(video, "test_shot.png");

    expect(res).toBe("data:image/png;base64,mocked");
    expect(mockDrawImage).toHaveBeenCalled();
  });
});
