import { Home, Search, Heart, User, Settings, PenSquare } from "lucide-react"
import { SettingsMenu } from "@/components/settings/SettingsMenu"
import { useState, useEffect, useRef } from "react"

export type PageType = "feed" | "search" | "notifications" | "profile"

interface SidebarProps {
  activePage: PageType
  onNavigate: (page: PageType) => void
  onOpenPost: () => void
}

const NAV_TOP: { page: PageType; icon: typeof Home; label: string }[] = [
  { page: "feed",          icon: Home,   label: "Trang chủ" },
  { page: "search",        icon: Search, label: "Tìm kiếm" },
]

const NAV_BOTTOM: { page: PageType; icon: typeof Home; label: string }[] = [
  { page: "notifications", icon: Heart,  label: "Thông báo" },
  { page: "profile",       icon: User,   label: "Trang cá nhân" },
]

export function Sidebar({ activePage, onNavigate, onOpenPost }: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [settingsOpen])

  const renderNavItem = ({ page, icon: Icon, label }: typeof NAV_TOP[number]) => {
    const isActive = activePage === page
    return (
      <button
        key={page}
        onClick={() => onNavigate(page)}
        title={label}
        className={`p-3 transition-all rounded-xl
          ${isActive
            ? "text-foreground bg-muted"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
      >
        <Icon
          size={28}
          strokeWidth={isActive ? 3 : 2.5}
          fill={isActive ? "currentColor" : "none"}
        />
      </button>
    )
  }

  return (
    <div className="h-full w-full flex flex-col items-center py-4 bg-transparent">
      {/* Nav icons centered — split by compose button */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        {NAV_TOP.map(renderNavItem)}

        {/* Compose / Post button between nav icons */}
        <button
          onClick={onOpenPost}
          title="Đăng bài"
          className="my-2 p-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded-xl"
        >
          <PenSquare size={28} strokeWidth={2.5} />
        </button>

        {NAV_BOTTOM.map(renderNavItem)}
      </div>

      {/* Settings at the bottom */}
      <div className="flex flex-col items-center mb-4 relative" ref={settingsRef}>
        <button
          onClick={() => setSettingsOpen(v => !v)}
          className="p-3 text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-muted"
        >
          <Settings size={28} strokeWidth={2.5} />
        </button>

        <SettingsMenu isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  )
}
