import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "./components/layout/AppLayout"
import { SubPageContainer, type FilterOption } from "./components/layout/SubPageContainer"
import { FeedPage } from "./components/feed/FeedPage"
import { SearchPage } from "./components/search/SearchPage"
import { NotificationsPage } from "./components/notifications/NotificationsPage"
import { ProfilePage } from "./components/profile/ProfilePage"
import { CreatePostModal } from "./components/post/CreatePostModal"
import { Sidebar, type PageType } from "./components/layout/Sidebar"
import { useState, useRef, useEffect } from "react"
import { Home, Search, Heart, User, PlusCircle, PenSquare } from "lucide-react"

// ─── Filter definitions ───────────────────────────────────────────────────────
const FEED_FILTERS: FilterOption[] = [
  { key: "foryou",    label: "Dành cho bạn" },
  { key: "following", label: "Đang theo dõi" },
  { key: "suggested", label: "Gợi ý" },
]

const NOTIF_FILTERS: FilterOption[] = [
  { key: "all",      label: "Tất cả" },
  { key: "replies",  label: "Phản hồi" },
  { key: "mentions", label: "Lượt nhắc" },
  { key: "follows",  label: "Theo dõi" },
  { key: "requests", label: "Yêu cầu" },
]

// ─── Types ───────────────────────────────────────────────────────────────────
type Column = {
  id: string
  pageType: PageType
  title: string
  filterOptions?: FilterOption[]
  activeFilter?: string
}

const PAGE_META: Record<PageType, { title: string; icon: typeof Home; filterOptions?: FilterOption[]; defaultFilter?: string }> = {
  feed:          { title: "Dành cho bạn", icon: Home,   filterOptions: FEED_FILTERS,  defaultFilter: "foryou" },
  search:        { title: "Tìm kiếm",     icon: Search, filterOptions: undefined },
  notifications: { title: "Tất cả",       icon: Heart,  filterOptions: NOTIF_FILTERS, defaultFilter: "all"    },
  profile:       { title: "Trang cá nhân",icon: User,   filterOptions: undefined },
}

const ADD_OPTIONS: PageType[] = ["feed", "search", "notifications", "profile"]

const INITIAL_COLUMNS: Column[] = [{
  id: "main-feed",
  pageType: "feed",
  title: PAGE_META.feed.title,
  filterOptions: FEED_FILTERS,
  activeFilter: "foryou",
}]

// ─── Page content router ──────────────────────────────────────────────────────
function PageContent({ pageType, onOpenPost, activeFilter }: {
  pageType: PageType
  onOpenPost: () => void
  activeFilter?: string
}) {
  switch (pageType) {
    case "search":        return <SearchPage />
    case "notifications": return <NotificationsPage activeFilter={activeFilter} />
    case "profile":       return <ProfilePage />
    default:              return <FeedPage onOpenPost={onOpenPost} activeFilter={activeFilter} />
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [activePage,      setActivePage]      = useState<PageType>("feed")
  const [columns,         setColumns]         = useState<Column[]>(INITIAL_COLUMNS)
  const [pickerOpen,      setPickerOpen]      = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const handleNavigate = (page: PageType) => {
    setActivePage(page)
    const meta = PAGE_META[page]
    setColumns(prev => {
      const updated = [...prev]
      updated[0] = {
        ...updated[0],
        pageType: page,
        title: meta.title,
        filterOptions: meta.filterOptions,
        activeFilter: meta.defaultFilter,
      }
      return updated
    })
  }

  const addColumn = (pageType: PageType) => {
    const meta = PAGE_META[pageType]
    setColumns(prev => [...prev, {
      id: `col-${Date.now()}`,
      pageType,
      title: meta.title,
      filterOptions: meta.filterOptions,
      activeFilter: meta.defaultFilter,
    }])
    setPickerOpen(false)
  }

  const removeColumn = (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id))
  }

  const updateFilter = (colId: string, filterKey: string) => {
    setColumns(prev => prev.map(c => {
      if (c.id !== colId) return c
      const label = c.filterOptions?.find(f => f.key === filterKey)?.label ?? c.title
      return { ...c, activeFilter: filterKey, title: label }
    }))
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [pickerOpen])

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-slate-50 text-foreground flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold mb-4">Threads Clone</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access your account</p>
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <Button variant="default" className="rounded-full px-8 py-6 text-lg font-bold">Log in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" className="rounded-full px-8 py-6 text-lg font-bold">Sign up</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <AppLayout
          sidebar={
            <Sidebar
              activePage={activePage}
              onNavigate={handleNavigate}
              onOpenPost={() => setIsPostModalOpen(true)}
            />
          }
        >
          {columns.map((col, idx) => (
            <SubPageContainer
              key={col.id}
              title={col.title}
              columnCount={columns.length}
              isDeletable={idx !== 0}
              onDelete={() => removeColumn(col.id)}
              filterOptions={col.filterOptions}
              activeFilter={col.activeFilter}
              onFilterChange={key => updateFilter(col.id, key)}
            >
              <PageContent
                pageType={col.pageType}
                onOpenPost={() => setIsPostModalOpen(true)}
                activeFilter={col.activeFilter}
              />
            </SubPageContainer>
          ))}

          {/* Floating Add Page Button */}
          <div className="flex items-start pt-[28px] pl-[30px] shrink-0 relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 shadow-sm transition-all hover:scale-105"
              title="Thêm trang"
            >
              <PlusCircle size={20} />
            </button>

            {pickerOpen && (
              <div className="absolute left-[30px] top-[52px] z-50 w-[190px] bg-popover border border-border rounded-2xl shadow-xl py-2 overflow-hidden">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pb-1.5">
                  Thêm trang
                </p>
                {ADD_OPTIONS.map(page => {
                  const { title, icon: Icon } = PAGE_META[page]
                  return (
                    <button
                      key={page}
                      onClick={() => addColumn(page)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left"
                    >
                      <Icon size={16} className="text-muted-foreground shrink-0" />
                      {title}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </AppLayout>

        {/* Fixed FAB — bottom right */}
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 h-11 bg-foreground text-background rounded-2xl font-semibold text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all"
        >
          <PenSquare size={16} strokeWidth={2.5} />
          Đăng bài
        </button>

        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
        />
      </SignedIn>
    </>
  )
}

export default App
