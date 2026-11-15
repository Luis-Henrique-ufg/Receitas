import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    fill?: string;
  }
>(({ className, value, fill: _fill, ...props }, ref) => {
  const isCompleted = value != null && value >= 100;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-all duration-700 ease-out rounded-full"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: isCompleted
            ? `linear-gradient(90deg, #00A196 0%, #2ac500 100%)`
            : `linear-gradient(90deg, #FF7020 0%, #FF9E66 50%, #FFAB3B 100%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
