import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    fill?: string;
  }
>(({ className, value, fill, ...props }, ref) => {
  const isCompleted = value !== undefined && value >= 100;

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
        className="h-full w-full flex-1 transition-all duration-700 ease-out rounded-full"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: isCompleted
            ? `linear-gradient(90deg, #10b981 0%, #14b8a6 100%)`
            : `linear-gradient(90deg, #007bff 0%, #00bfff 50%, #29C5F6 100%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
