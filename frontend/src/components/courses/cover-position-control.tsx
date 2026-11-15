import React, { useRef, useState } from "react";
import { Move, RotateCcw } from "lucide-react";
import { parseCoverPosition } from "@/utils/courseCategory";
import { cn } from "@/lib/utils";

interface CoverPositionControlProps {
  imageSrc: string;
  value: string;
  onChange: (nextPosition: string) => void;
}

const PRESETS = [
  { label: "Topo", value: "50% 0%" },
  { label: "Centro", value: "50% 50%" },
  { label: "Base", value: "50% 100%" },
  { label: "Esquerda", value: "0% 50%" },
  { label: "Direita", value: "100% 50%" },
];

export default function CoverPositionControl({
  imageSrc,
  value,
  onChange,
}: CoverPositionControlProps) {
  const { x, y } = parseCoverPosition(value);
  const frameRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: x,
      startY: y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    // Dragging the image right/down moves the focal point left/up (natural grab-and-pan feel)
    const nextX = Math.max(
      0,
      Math.min(100, Math.round(dragStartRef.current.startX - (dx / Math.max(1, rect.width)) * 100))
    );
    const nextY = Math.max(
      0,
      Math.min(100, Math.round(dragStartRef.current.startY - (dy / Math.max(1, rect.height)) * 100))
    );
    onChange(`${nextX}% ${nextY}%`);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-primary" />
          Enquadramento da capa (arraste a imagem ou ajuste abaixo)
        </span>
        <button
          type="button"
          onClick={() => onChange("50% 50%")}
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
          title="Centralizar (50% 50%)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Centralizar</span>
        </button>
      </div>

      {/* Interactive Live Card Preview Frame */}
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-border bg-[#2a2522] select-none touch-none group",
          isDragging ? "cursor-grabbing ring-2 ring-primary" : "cursor-grab"
        )}
      >
        <img
          src={imageSrc}
          alt="Prévia do enquadramento"
          draggable={false}
          style={{ objectPosition: `${x}% ${y}%` }}
          className="w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Subtle rule-of-thirds / center crosshair guide while dragging */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-150",
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-60"
          )}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/40" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-white/40" />
        </div>

        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10.5px] font-mono border border-white/15 pointer-events-none">
          X: {x}% · Y: {y}%
        </div>
      </div>

      {/* Quick Presets + Fine Sliders */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => {
            const isActive = `${x}% ${y}%` === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-[#030607] border-primary font-semibold shadow-sm"
                    : "bg-card hover:bg-secondary border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Horizontal (X)</span>
              <span className="font-mono text-foreground">{x}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={x}
              onChange={(e) => onChange(`${e.target.value}% ${y}%`)}
              className="w-full h-1.5 accent-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Vertical (Y)</span>
              <span className="font-mono text-foreground">{y}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={y}
              onChange={(e) => onChange(`${x}% ${e.target.value}%`)}
              className="w-full h-1.5 accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
