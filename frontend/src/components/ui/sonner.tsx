import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-card text-foreground border border-border w-full p-4 rounded-2xl flex gap-3 shadow-xl",
          title: "font-display font-medium text-sm text-foreground",
          description: "text-xs text-muted-foreground",
          error: "border-rose-500/50 bg-rose-500/10 text-rose-500",
          success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
          warning: "border-amber-500/50 bg-amber-500/10 text-amber-500",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-[#030607] group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:rounded-full shadow-sm",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:border group-[.toast]:border-border group-[.toast]:text-foreground group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
