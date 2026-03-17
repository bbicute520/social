import { Moon, Sun, LogOut, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"
import { useClerk, useUser } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useClerk()
  const { user } = useUser()

  const handleSignOut = async () => {
    try {
      onOpenChange(false) // Close dialog first for better UX
      await signOut({ redirectUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

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

          {/* Account Section */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h4 className="text-sm font-medium">Tài khoản</h4>
              <p className="text-sm text-muted-foreground">
                Quản lý tài khoản của bạn
              </p>
            </div>

            {/* Current User Info */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.fullName || user.username || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
