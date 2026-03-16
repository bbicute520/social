import { Moon, Sun } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cài đặt</DialogTitle>
          <DialogDescription>
            Tùy chỉnh giao diện và trải nghiệm của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-medium">Giao diện</h4>
              <p className="text-sm text-muted-foreground">
                Chuyển đổi chế độ sáng/tối
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className={`
                relative inline-flex h-11 w-20 items-center rounded-full
                transition-colors duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                ${theme === "dark" ? "bg-primary" : "bg-muted"}
              `}
              role="switch"
              aria-checked={theme === "dark"}
            >
              <span
                className={`
                  inline-flex h-9 w-9 items-center justify-center rounded-full
                  bg-background shadow-lg transform transition-transform duration-300 ease-in-out
                  ${theme === "dark" ? "translate-x-10" : "translate-x-1"}
                `}
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Additional settings can be added here */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            Threads Clone · Version 1.0.0
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
