import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostCard } from "./PostCard"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/hooks/useApi"
import type { PaginatedResponse, Post } from "@/types/api"
import { Loader2 } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useI18n } from "@/contexts/I18nContext"
import { formatRelativeTime } from "@/lib/time"
import { CommentThreadDialog } from "./CommentThreadDialog"
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile"

interface FeedPageProps {
  onOpenPost: () => void
  activeFilter?: string
}

const FEED_PAGE_SIZE = 20

export function FeedPage({ onOpenPost, activeFilter }: FeedPageProps) {
  const { language, t } = useI18n()
  const { apiFetch } = useApi()
  const { user } = useUser()
  const { data: me } = useCurrentUserProfile()
  const queryClient = useQueryClient()
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const feedFilter = activeFilter === "following" ? "following" : "foryou"

  const patchPostAcrossCaches = useCallback(
    (postId: string, updater: (post: Post) => Post) => {
      queryClient.setQueriesData({ queryKey: ["posts"] }, (current) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const patchPage = (page: PaginatedResponse<Post>) => {
          if (!Array.isArray(page.data)) {
            return { page, changed: false }
          }

          let changed = false
          const nextData = page.data.map((post) => {
            if (post.id !== postId) {
              return post
            }

            changed = true
            return updater(post)
          })

          return {
            page: changed
              ? {
                  ...page,
                  data: nextData,
                }
              : page,
            changed,
          }
        }

        const singlePage = current as PaginatedResponse<Post>
        if (Array.isArray(singlePage.data)) {
          const { page, changed } = patchPage(singlePage)
          return changed ? page : current
        }

        const infinitePages = current as {
          pages?: PaginatedResponse<Post>[]
          pageParams?: unknown[]
        }

        if (!Array.isArray(infinitePages.pages)) {
          return current
        }

        let changed = false
        const nextPages = infinitePages.pages.map((page) => {
          const patched = patchPage(page)
          if (patched.changed) {
            changed = true
          }

          return patched.page
        })

        return changed
          ? {
              ...infinitePages,
              pages: nextPages,
            }
          : current
      })
    },
    [queryClient]
  )

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery<PaginatedResponse<Post>>({
    queryKey: ["posts", "feed", feedFilter],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        filter: feedFilter,
        limit: String(FEED_PAGE_SIZE),
      })

      if (typeof pageParam === "string" && pageParam.length > 0) {
        params.set("cursor", pageParam)
      }

      return apiFetch(`/api/posts/feed?${params.toString()}`)
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor || undefined
    },
  })

  const likeMutation = useMutation({
    mutationFn: async (payload: { postId: string; isLiked: boolean }) => {
      const method = payload.isLiked ? "DELETE" : "POST"
      return apiFetch(`/api/posts/${payload.postId}/like`, {
        method,
      })
    },
    onSuccess: (_response, payload) => {
      const likeDelta = payload.isLiked ? -1 : 1

      patchPostAcrossCaches(payload.postId, (post) => ({
        ...post,
        isLikedByMe: !payload.isLiked,
        likeCount: Math.max(0, post.likeCount + likeDelta),
      }))

      queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "inactive" })
    },
  })

  const repostMutation = useMutation({
    mutationFn: async (payload: { postId: string; isReposted: boolean }) => {
      const method = payload.isReposted ? "DELETE" : "POST"
      return apiFetch(`/api/posts/${payload.postId}/repost`, {
        method,
      })
    },
    onSuccess: (_response, payload) => {
      patchPostAcrossCaches(payload.postId, (post) => ({
        ...post,
        isRepostedByMe: !payload.isReposted,
      }))

      queryClient.invalidateQueries({ queryKey: ["posts", "my-reposts", user?.id], refetchType: "inactive" })
      queryClient.invalidateQueries({ queryKey: ["posts", "reposts", user?.id], refetchType: "inactive" })
    },
  })

  const createCommentMutation = useMutation({
    mutationFn: async (payload: { postId: string; content: string }) => {
      return apiFetch(`/api/comments/post/${payload.postId}`, {
        method: "POST",
        body: JSON.stringify({
          content: payload.content,
        }),
      })
    },
    onSuccess: (_response, variables) => {
      setCommentDrafts((prev) => ({
        ...prev,
        [variables.postId]: "",
      }))

      patchPostAcrossCaches(variables.postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }))

      queryClient.invalidateQueries({ queryKey: ["comments", "thread", variables.postId] })
      queryClient.invalidateQueries({ queryKey: ["comments", "user", user?.id], refetchType: "inactive" })
    },
  })

  const posts = data?.pages.flatMap((page) => page.data) || []
  const activeCommentPostId = activeCommentPost?.id || null
  const activeCommentDraft = activeCommentPostId ? (commentDrafts[activeCommentPostId] || "") : ""
  const activeCommentPending = Boolean(
    createCommentMutation.isPending &&
      activeCommentPostId &&
      createCommentMutation.variables?.postId === activeCommentPostId
  )

  const handleToggleComments = (post: Post) => {
    setActiveCommentPost((prev) => (prev?.id === post.id ? null : post))
  }

  const handleCommentDraftChange = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }))
  }

  const handleCreateComment = (postId: string) => {
    const content = (commentDrafts[postId] || "").trim()

    if (!content || createCommentMutation.isPending) {
      return
    }

    createCommentMutation.mutate({
      postId,
      content,
    })
  }

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || !hasNextPage || isFetchingNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0.01,
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Inline Create Post Trigger */}
      <div
        onClick={onOpenPost}
        className="flex items-center gap-4 border-b border-border/50 bg-gradient-to-r from-muted/35 via-card to-card px-6 py-4 cursor-pointer hover:from-muted/45 transition-colors"
      >
        <Avatar className="w-10 h-10 border-2 border-border">
          <AvatarImage src={me?.avatar || me?.imageUrl || user?.imageUrl} />
          <AvatarFallback>{(me?.displayName || me?.username || user?.firstName || 'U')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-muted-foreground text-[15px]">
          {t("feed.startThread")}
        </div>
        <button className="px-4 py-1.5 bg-card text-foreground border-2 border-border font-semibold rounded-full text-sm transition-transform hover:bg-muted active:scale-95">
          {t("feed.post")}
        </button>
      </div>

      {/* Feed — filtered by activeFilter */}
      <div className="flex flex-col">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        )}

        {error && (
          <div className="text-center py-10 px-6">
            <p className="text-red-600 font-semibold mb-2">{t("feed.loadPostsError")}</p>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : t("common.unknownError")}</p>
          </div>
        )}

        {!isLoading && !error && posts.map(post => {
          const timestamp = formatRelativeTime(post.createdAt, language, t)
          const isLiked = Boolean(post.isLikedByMe)
          const isReposted = Boolean(post.isRepostedByMe)
          const isCommentsOpen = activeCommentPost?.id === post.id
          const likeDisabled =
            likeMutation.isPending && likeMutation.variables?.postId === post.id
          const repostDisabled =
            repostMutation.isPending && repostMutation.variables?.postId === post.id

          return (
            <div key={post.id}>
              <PostCard
                id={post.id}
                author={{
                  name: post.author.displayName || post.author.username || t("common.anonymous"),
                  username: post.author.username || 'unknown',
                  avatar: post.author.avatar || post.author.imageUrl || `https://ui-avatars.com/api/?name=${post.author.username || 'User'}`,
                  isVerified: post.author.isVerified
                }}
                content={post.content}
                imageUrls={post.imageUrls}
                timestamp={timestamp}
                likes={post.likeCount}
                comments={post.commentCount}
                hasReply={false}
                isLiked={isLiked}
                likeDisabled={Boolean(likeDisabled)}
                onToggleLike={() => likeMutation.mutate({ postId: post.id, isLiked })}
                commentsOpen={isCommentsOpen}
                onToggleComments={() => handleToggleComments(post)}
                isReposted={isReposted}
                repostDisabled={Boolean(repostDisabled)}
                onToggleRepost={() => repostMutation.mutate({ postId: post.id, isReposted })}
              />
            </div>
          )
        })}
        
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {t("feed.noPosts")}
          </div>
        )}

        {!isLoading && !error && hasNextPage && (
          <div ref={loadMoreRef} className="flex h-16 items-center justify-center px-6 py-4">
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                {t("common.loading")}
              </span>
            ) : null}
          </div>
        )}

        <div className="h-20" />
      </div>

      <CommentThreadDialog
        isOpen={Boolean(activeCommentPost)}
        post={activeCommentPost}
        draft={activeCommentDraft}
        isSubmitting={activeCommentPending}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCommentPost(null)
          }
        }}
        onDraftChange={(value) => {
          if (!activeCommentPostId) {
            return
          }
          handleCommentDraftChange(activeCommentPostId, value)
        }}
        onSubmit={() => {
          if (!activeCommentPostId) {
            return
          }
          handleCreateComment(activeCommentPostId)
        }}
      />
    </div>
  )
}
