import { Moon, Sun, Globe, Bell, Lock, LogOut, ChevronRight } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useState } from "react"

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { theme, setTheme } = useTheme()
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false)

  if (!isOpen) return null

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Đăng xuất")
    onClose()
  }

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    setShowThemeSubmenu(false)
  }

  return (
    <>
      {/* Main Menu */}
      {!showThemeSubmenu && (
        <div className="absolute left-0 bottom-[60px] z-50 w-[190px] bg-popover border border-border rounded-2xl shadow-xl py-2 overflow-hidden">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pb-1.5">
            Cài đặt
          </p>

          {/* Theme */}
          <button
            onClick={() => setShowThemeSubmenu(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon size={16} className="text-muted-foreground shrink-0" />
              ) : (
                <Sun size={16} className="text-muted-foreground shrink-0" />
              )}
              Giao diện
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>

          {/* Language */}
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left"
          >
            <Globe size={16} className="text-muted-foreground shrink-0" />
            Ngôn ngữ
          </button>

          {/* Notifications */}
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left"
          >
            <Bell size={16} className="text-muted-foreground shrink-0" />
            Thông báo
          </button>

          {/* Privacy */}
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left"
          >
            <Lock size={16} className="text-muted-foreground shrink-0" />
            Quyền riêng tư
          </button>

          {/* Divider */}
          <div className="my-1 h-px bg-border mx-2" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left text-red-600"
          >
            <LogOut size={16} className="shrink-0" />
            Đăng xuất
          </button>
        </div>
      )}

      {/* Theme Submenu */}
      {showThemeSubmenu && (
        <div className="absolute left-0 bottom-[60px] z-50 w-[190px] bg-popover border border-border rounded-2xl shadow-xl py-2 overflow-hidden">
          <button
            onClick={() => setShowThemeSubmenu(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/40"
          >
            <ChevronRight size={12} className="rotate-180" />
            Giao diện
          </button>

          <button
            onClick={() => handleThemeChange("light")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left ${
              theme === "light" ? "bg-muted/40" : ""
            }`}
          >
            <Sun size={16} className="text-muted-foreground shrink-0" />
            Sáng
          </button>

          <button
            onClick={() => handleThemeChange("dark")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left ${
              theme === "dark" ? "bg-muted/40" : ""
            }`}
          >
            <Moon size={16} className="text-muted-foreground shrink-0" />
            Tối
          </button>
        </div>
      )}
    </>
  )
}
