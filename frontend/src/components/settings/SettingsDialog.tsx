import { Moon, Sun, LogOut, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"
import { useI18n } from "@/contexts/I18nContext"
import { useClerk, useUser } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()
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
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>
            {t("settings.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-medium">{t("settings.theme")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("settings.theme.description")}
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
              <h4 className="text-sm font-medium">{t("settings.account")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("settings.account.description")}
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
                    {user.fullName || user.username || t("common.user")}
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
              {t("settings.logout")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
