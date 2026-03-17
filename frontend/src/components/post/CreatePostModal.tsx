import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/hooks/useApi"
import { useUser } from "@clerk/clerk-react"
import { Loader2, Image as ImageIcon, X, Globe, Users, ChevronDown, Check, FileText, Trash2, Clock, ArrowLeft } from "lucide-react"

type ReplyPermission = 'everyone' | 'followers'

const REPLY_OPTIONS = {
  everyone: { label: 'Mọi người', icon: Globe },
  followers: { label: 'Người theo dõi', icon: Users },
} as const

interface Draft {
  id: string
  content: string
  images: string[] // Base64 encoded
  replyPermission: ReplyPermission
  timestamp: number
}

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  initialDraft?: Draft | null
  onOpenDrafts?: () => void
}

type ViewMode = 'compose' | 'drafts'

export function CreatePostModal({ isOpen, onClose, initialDraft = null, onOpenDrafts }: CreatePostModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('compose')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [content, setContent] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [replyPermission, setReplyPermission] = useState<ReplyPermission>('everyone')
  const [showReplyMenu, setShowReplyMenu] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const replyMenuRef = useRef<HTMLDivElement>(null)

  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  const { user } = useUser()

  // Load drafts when opening drafts view
  const loadDrafts = () => {
    const savedDrafts = localStorage.getItem('post-drafts')
    if (savedDrafts) {
      try {
        const parsedDrafts: Draft[] = JSON.parse(savedDrafts)
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

  const selectDraft = (draft: Draft) => {
    setContent(draft.content)
    setReplyPermission(draft.replyPermission)
    setImages([])
    setCurrentDraftId(draft.id)
    setHasDraft(true)
    setViewMode('compose')
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

  // Load initial draft or from localStorage
  useEffect(() => {
    if (isOpen) {
      if (initialDraft) {
        // Load from selected draft
        setContent(initialDraft.content)
        setReplyPermission(initialDraft.replyPermission)
        setImages([])
        setCurrentDraftId(initialDraft.id)
        setHasDraft(true)
        setViewMode('compose')
      } else {
        // Clear form for new post
        setContent("")
        setImages([])
        setReplyPermission('everyone')
        setCurrentDraftId(null)
        setHasDraft(false)
        setViewMode('compose')
      }
      loadDrafts()
    }
  }, [isOpen, initialDraft])

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; images: File[]; replyPermission: ReplyPermission }) => {
      const formData = new FormData()
      formData.append('content', data.content)
      formData.append('replyPermission', data.replyPermission)

      data.images.forEach((image) => {
        formData.append(`images`, image)
      })

      return apiFetch("/api/posts", {
        method: "POST",
        body: formData,
        headers: {
          // Không set Content-Type, browser tự set cho FormData
        },
      })
    },
    onSuccess: () => {
      // Delete current draft if exists
      if (currentDraftId) {
        const savedDrafts = localStorage.getItem('post-drafts')
        if (savedDrafts) {
          try {
            const drafts: Draft[] = JSON.parse(savedDrafts)
            const updatedDrafts = drafts.filter(d => d.id !== currentDraftId)
            localStorage.setItem('post-drafts', JSON.stringify(updatedDrafts))
          } catch (e) {
            console.error('Failed to delete draft:', e)
          }
        }
      }

      setContent("")
      setImages([])
      setReplyPermission('everyone')
      setCurrentDraftId(null)
      onClose()
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
    onError: (error) => {
      console.error("Failed to post:", error)
      alert("Đã xảy ra lỗi khi đăng bài thử lại sau!")
    }
  })

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 300)}px`
    }
  }, [content])

  // Close reply menu when click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (replyMenuRef.current && !replyMenuRef.current.contains(e.target as Node)) {
        setShowReplyMenu(false)
      }
    }
    if (showReplyMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReplyMenu])

  // Handle Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isOpen) {
        e.preventDefault()
        handlePost()
      }
      // ESC to close with confirm
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        handleCloseAttempt()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, content, images])

  const handlePost = () => {
    if (!content.trim() || createPostMutation.isPending) return
    createPostMutation.mutate({ content, images, replyPermission })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    setImages(prev => [...prev, ...imageFiles].slice(0, 4)) // Max 4 images
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleCloseAttempt = () => {
    if (content.trim() || images.length > 0) {
      setShowDiscardDialog(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    // If editing existing draft, delete it
    if (currentDraftId) {
      const savedDrafts = localStorage.getItem('post-drafts')
      if (savedDrafts) {
        try {
          const drafts: Draft[] = JSON.parse(savedDrafts)
          const updatedDrafts = drafts.filter(d => d.id !== currentDraftId)
          localStorage.setItem('post-drafts', JSON.stringify(updatedDrafts))
        } catch (e) {
          console.error('Failed to delete draft:', e)
        }
      }
    }

    setContent("")
    setImages([])
    setReplyPermission('everyone')
    setCurrentDraftId(null)
    setShowDiscardDialog(false)
    onClose()
  }

  const handleSaveDraft = async () => {
    const savedDrafts = localStorage.getItem('post-drafts')
    let drafts: Draft[] = []

    try {
      if (savedDrafts) {
        drafts = JSON.parse(savedDrafts)
      }
    } catch (e) {
      console.error('Failed to parse drafts:', e)
    }

    const draftId = currentDraftId || `draft-${Date.now()}`
    const newDraft: Draft = {
      id: draftId,
      content,
      images: [], // For now, don't save images to localStorage (too large)
      replyPermission,
      timestamp: Date.now(),
    }

    // Update existing draft or add new one
    const existingIndex = drafts.findIndex(d => d.id === draftId)
    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft
    } else {
      drafts.unshift(newDraft) // Add to beginning
    }

    // Keep only last 20 drafts
    drafts = drafts.slice(0, 20)

    localStorage.setItem('post-drafts', JSON.stringify(drafts))

    setContent("")
    setImages([])
    setReplyPermission('everyone')
    setCurrentDraftId(null)
    setShowDiscardDialog(false)
    onClose()
  }

  const hasContent = content.trim() || images.length > 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-none w-[calc(100vw-80px-440px-420px)] ml-[calc(40px)] bg-card p-0 gap-0 overflow-hidden border-2 border-border rounded-[32px] shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-border/50 relative">
            <DialogTitle className="text-center font-bold text-[17px]">
              {viewMode === 'compose' ? 'Tạo chủ đề mới' : `Bản nháp (${drafts.length})`}
            </DialogTitle>
            <DialogDescription className="sr-only">Create a new post or view drafts</DialogDescription>

            {/* Drafts button in top-left corner / Back button when in drafts view */}
            {viewMode === 'compose' ? (
              <button
                onClick={() => {
                  if (onOpenDrafts) {
                    onClose()
                    onOpenDrafts()
                    return
                  }

                  loadDrafts()
                  setViewMode('drafts')
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Bản nháp"
              >
                <FileText size={20} />
              </button>
            ) : (
              <button
                onClick={() => setViewMode('compose')}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
            )}
          </DialogHeader>

          {viewMode === 'compose' ? (
            // Compose View
            <>
              {hasDraft && content && (
                <div className="mx-6 mt-4 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-600 dark:text-blue-400">
                  📝 Đã khôi phục bản nháp
                </div>
              )}

              <div className="max-h-[70vh] overflow-y-auto">
            <div className="p-6 flex gap-3">
              <div className="flex flex-col items-center">
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>{user?.firstName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="w-[2px] bg-border flex-1 mt-2 mb-1 rounded-full min-h-[20px]"></div>
              </div>

              <div className="flex-1 flex flex-col pt-1 gap-3">
                <div>
                  <span className="font-semibold text-[15px]">{user?.fullName || user?.username || "You"}</span>
                  <textarea
                    ref={textareaRef}
                    className="mt-2 w-full bg-transparent resize-none outline-none text-[15px] placeholder:text-muted-foreground max-h-[300px] overflow-y-auto"
                    placeholder="Bắt đầu một chủ đề..."
                    autoFocus
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={1}
                  />
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className={`grid gap-2 ${
                    images.length === 1 ? 'grid-cols-1' :
                    images.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {images.map((image, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex gap-1">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={images.length >= 4}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Thêm ảnh"
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-between items-center border-t border-border/50 bg-muted/5">
            {/* Reply Permission Dropdown */}
            <div className="relative" ref={replyMenuRef}>
              <button
                onClick={() => setShowReplyMenu(v => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {(() => {
                  const Icon = REPLY_OPTIONS[replyPermission].icon
                  return (
                    <>
                      <Icon size={16} />
                      <span>{REPLY_OPTIONS[replyPermission].label} có thể trả lời</span>
                      <ChevronDown size={14} className={`transition-transform ${showReplyMenu ? 'rotate-180' : ''}`} />
                    </>
                  )
                })()}
              </button>

              {showReplyMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-popover border border-border rounded-xl shadow-xl py-1.5 overflow-hidden z-50">
                  <p className="text-xs font-semibold text-muted-foreground px-3 py-2">Ai có thể trả lời?</p>
                  {Object.entries(REPLY_OPTIONS).map(([key, { label, icon: Icon }]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setReplyPermission(key as ReplyPermission)
                        setShowReplyMenu(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-muted-foreground" />
                        <span>{label}</span>
                      </div>
                      {replyPermission === key && <Check size={16} className="text-foreground" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handlePost}
              disabled={!hasContent || createPostMutation.isPending}
              className="rounded-full px-8 py-5 font-semibold transition-all bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {createPostMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Đăng"}
            </Button>
          </div>
            </>
          ) : (
            // Drafts View
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
                          onClick={() => selectDraft(draft)}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation Dialog */}
      {showDiscardDialog && (
        <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <DialogContent className="sm:max-w-[400px] bg-card border-2 border-border rounded-[32px] p-6">
            <DialogHeader>
              <DialogTitle className="text-center font-bold text-lg">Lưu bài đăng?</DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2">
                Bạn có thể lưu nội dung này vào nháp để đăng sau.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-6">
              <Button
                onClick={handleSaveDraft}
                className="w-full rounded-xl py-6 font-semibold bg-foreground text-background hover:bg-foreground/90"
              >
                Lưu nháp
              </Button>
              <Button
                onClick={handleConfirmDiscard}
                variant="destructive"
                className="w-full rounded-xl py-6 font-semibold"
              >
                Bỏ
              </Button>
              <Button
                onClick={() => setShowDiscardDialog(false)}
                variant="outline"
                className="w-full rounded-xl py-6 font-semibold"
              >
                Tiếp tục chỉnh sửa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
