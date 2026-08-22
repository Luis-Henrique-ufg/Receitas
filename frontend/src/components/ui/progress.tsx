import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    fill?: string;
    variant?: "default" | "success";
  }
>(({ className, value, fill, variant, ...props }, ref) => {
  const isCompleted = variant === "success" || (value !== undefined && value >= 100);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-all duration-700 ease-out"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: isCompleted
            ? `linear-gradient(90deg, #10b981 0%, #14b8a6 100%)`
            : `linear-gradient(90deg, #007bff 0%, #00bfff 60%, #29C5F6 100%)`,
          boxShadow: value && value > 0
            ? isCompleted
              ? `0 0 10px rgba(16,185,129,0.6), 0 0 20px rgba(20,184,166,0.3)`
              : `0 0 10px rgba(0,123,255,0.6), 0 0 20px rgba(0,123,255,0.3)`
            : "none",
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
