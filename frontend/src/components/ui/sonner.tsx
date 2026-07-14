import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast glass-panel w-full p-4 rounded-xl flex gap-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] !bg-transparent",
          title: "font-heading font-medium text-sm text-white",
          description: "text-xs text-white/70",
          error: "!border-t-red-500/50 !border-l-red-500/30 !border-r-red-500/30 !border-b-red-500/20 bg-red-900/20 text-red-100",
          success: "!border-t-green-500/50 !border-l-green-500/30 !border-r-green-500/30 !border-b-green-500/20 bg-green-900/20 text-green-100",
          warning: "!border-t-yellow-500/50 !border-l-yellow-500/30 !border-r-yellow-500/30 !border-b-yellow-500/20 bg-yellow-900/20 text-yellow-100",
          actionButton:
            "group-[.toast]:bg-[#007bff] group-[.toast]:text-white group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:uppercase group-[.toast]:tracking-widest group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:glass-panel group-[.toast]:border group-[.toast]:border-white/10 group-[.toast]:text-white/70 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:uppercase group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-lg group-[.toast]:hover:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
