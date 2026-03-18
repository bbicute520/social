import type { ReactNode } from "react"

interface AppLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  isSingleColumnMode?: boolean
}

export function AppLayout({ children, sidebar, isSingleColumnMode = false }: AppLayoutProps) {
  return (
    <div className="h-screen w-full grid grid-cols-[80px_1fr] bg-background text-foreground overflow-hidden">
      {/* Sidebar cố định bên trái */}
      <aside className="h-full">
        {sidebar}
      </aside>

      {/* Vùng nội dung - conditional scroll behavior */}
      {isSingleColumnMode ? (
        // Trang đơn: scroll dọc toàn màn hình, container căn giữa
        <main className="h-full w-full overflow-y-auto overflow-x-hidden">
          <div className="flex justify-center pt-4 pb-4">
            {children}
          </div>
        </main>
      ) : (
        // Đa cột: scroll ngang, mỗi container có scroll riêng
        <main className="h-full w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="flex h-full gap-5 pt-4 px-4 pb-4 mx-auto w-fit min-w-full justify-center">
            {children}
          </div>
        </main>
      )}
    </div>
  )
}
