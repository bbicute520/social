import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Clock } from "lucide-react"

interface Draft {
  id: string
  content: string
  images: string[]
  replyPermission: 'everyone' | 'followers'
  timestamp: number
}

interface DraftsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectDraft: (draft: Draft) => void
}

export function DraftsModal({ isOpen, onClose, onSelectDraft }: DraftsModalProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    if (isOpen) {
      loadDrafts()
    }
  }, [isOpen])

  const loadDrafts = () => {
    const savedDrafts = localStorage.getItem('post-drafts')
    if (savedDrafts) {
      try {
        const parsedDrafts: Draft[] = JSON.parse(savedDrafts)
        // Sort by timestamp, newest first
        setDrafts(parsedDrafts.sort((a, b) => b.timestamp - a.timestamp))
      } catch (e) {
        console.error('Failed to load drafts:', e)
        setDrafts([])
      }
    } else {
      setDrafts([])
    }
  }

  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== id)
    setDrafts(updatedDrafts)
    localStorage.setItem('post-drafts', JSON.stringify(updatedDrafts))
  }

  const handleSelectDraft = (draft: Draft) => {
    onSelectDraft(draft)
    onClose()
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card p-0 gap-0 overflow-hidden border-2 border-border rounded-[32px] shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="text-center font-bold text-[17px]">Bản nháp ({drafts.length})</DialogTitle>
          <DialogDescription className="sr-only">Manage your drafts</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Clock size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Chưa có bản nháp</h3>
              <p className="text-sm text-muted-foreground">
                Các bài viết bạn lưu nháp sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-6 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleSelectDraft(draft)}
                      className="flex-1 text-left"
                    >
                      <p className="text-[15px] line-clamp-3 mb-2">
                        {draft.content || <span className="text-muted-foreground italic">Bản nháp trống</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{formatDate(draft.timestamp)}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="p-2 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa bản nháp"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {drafts.length > 0 && (
          <div className="px-6 py-4 border-t border-border/50 bg-muted/5">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full rounded-xl py-6 font-semibold"
            >
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
