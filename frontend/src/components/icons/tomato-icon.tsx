import tomatoSvg from "@/assets/icon-park-twotone--tomato.svg";
import { cn } from "@/lib/utils";

interface TomatoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function TomatoIcon({
  className,
  alt = "Tomate Pomodoro",
  ...props
}: TomatoIconProps) {
  return (
    <img
      src={tomatoSvg}
      alt={alt}
      className={cn(
        "w-4 h-4 inline-block shrink-0 select-none align-middle pointer-events-none drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]",
        className
      )}
      draggable={false}
      {...props}
    />
  );
}

export default TomatoIcon;
