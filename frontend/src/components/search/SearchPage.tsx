import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/hooks/useApi"
import { useI18n } from "@/contexts/I18nContext"
import { UserHoverPreview } from "@/components/profile/UserHoverPreview"
import type { Post, User } from "@/types/api"

type SearchTab = "suggested" | "trending" | "people"

type SearchUser = User & {
  isFollowing?: boolean
}

type SearchUsersResponse = {
  users: SearchUser[]
}

type SearchPostsResponse = {
  posts: Post[]
}

export function SearchPage() {
  const { t } = useI18n()
  const { apiFetch } = useApi()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<SearchTab>("suggested")

  const SEARCH_TABS: { key: SearchTab; label: string }[] = [
    { key: "suggested", label: t("search.tab.suggested") },
    { key: "trending", label: t("search.tab.trending") },
    { key: "people", label: t("search.tab.people") },
  ]

  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const normalizedDebouncedQuery = debouncedQuery.trim()

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)
    return () => clearTimeout(handler)
  }, [query])

  const usersQuery = useQuery<SearchUsersResponse>({
    queryKey: ["search", "users", normalizedDebouncedQuery],
    queryFn: () =>
      apiFetch(
        `/api/search?type=users${
          normalizedDebouncedQuery ? `&q=${encodeURIComponent(normalizedDebouncedQuery)}` : ""
        }`
      ),
    enabled: activeTab !== "trending",
  })

  const trendingQuery = useQuery<SearchPostsResponse>({
    queryKey: ["search", "posts", normalizedDebouncedQuery],
    queryFn: () =>
      apiFetch(
        `/api/search?type=posts${
          normalizedDebouncedQuery ? `&q=${encodeURIComponent(normalizedDebouncedQuery)}` : ""
        }`
      ),
    enabled: activeTab === "trending",
  })

  const followMutation = useMutation({
    mutationFn: async (payload: { userId: string; shouldFollow: boolean }) => {
      return apiFetch(`/api/users/${payload.userId}/follow`, {
        method: payload.shouldFollow ? "POST" : "DELETE",
      })
    },
    onMutate: async ({ userId, shouldFollow }) => {
      const previousQueries = queryClient.getQueriesData<SearchUsersResponse>({
        queryKey: ["search", "users"],
      })

      for (const [cacheKey, data] of previousQueries) {
        if (!data) {
          continue
        }

        queryClient.setQueryData<SearchUsersResponse>(cacheKey, {
          users: data.users.map((user) => {
            if (user.id !== userId) {
              return user
            }

            const baseFollowerCount = user.followerCount ?? user._count?.followers ?? 0
            const nextFollowerCount = Math.max(0, baseFollowerCount + (shouldFollow ? 1 : -1))

            return {
              ...user,
              isFollowing: shouldFollow,
              followerCount: nextFollowerCount,
              _count: user._count
                ? {
                    ...user._count,
                    followers: nextFollowerCount,
                  }
                : user._count,
            }
          }),
        })
      }

      return { previousQueries }
    },
    onError: (_error, _payload, context) => {
      if (!context) {
        return
      }

      for (const [cacheKey, data] of context.previousQueries) {
        queryClient.setQueryData(cacheKey, data)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "users"] })
    },
  })

  const usersToDisplay = usersQuery.data?.users || []
  const trendingPosts = trendingQuery.data?.posts || []
  const isLoading = activeTab === "trending" ? trendingQuery.isLoading : usersQuery.isLoading

  const toggleFollow = (user: SearchUser) => {
    if (followMutation.isPending && followMutation.variables?.userId === user.id) {
      return
    }

    followMutation.mutate({
      userId: user.id,
      shouldFollow: !user.isFollowing,
    })
  }

  return (
    <div className="flex flex-col w-full">
      {/* Search bar + tabs — sticky */}
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="pl-9 rounded-full bg-muted/40 border-transparent focus-visible:border-border/60 focus-visible:ring-0 text-sm h-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {SEARCH_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative
                ${activeTab === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col divide-y divide-border/40">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        )}

        {!isLoading && activeTab !== "trending" && usersToDisplay.map((user) => {
          const followerCount = user.followerCount ?? user._count?.followers ?? 0
          const isFollowing = Boolean(user.isFollowing)
          const followPending =
            followMutation.isPending && followMutation.variables?.userId === user.id

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/15 transition-colors"
            >
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={user.avatar || user.imageUrl || undefined} />
                <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <UserHoverPreview
                  username={user.username}
                  fallbackName={user.displayName || user.username}
                  className="text-sm font-semibold leading-tight truncate hover:underline cursor-pointer"
                />
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username} {followerCount > 0 ? `· ${t("search.followers", { count: followerCount })}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={() => toggleFollow(user)}
                disabled={followPending}
                className="rounded-full text-xs h-8 px-4 shrink-0"
              >
                {isFollowing ? t("search.following") : t("search.follow")}
              </Button>
            </div>
          )
        })}

        {!isLoading && activeTab !== "trending" && usersToDisplay.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {t("search.noUsers")}
          </div>
        )}

        {!isLoading && activeTab === "trending" && trendingPosts.map((post) => (
          <div key={post.id} className="px-4 py-3.5 hover:bg-muted/15 transition-colors">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={post.author.avatar || post.author.imageUrl || undefined} />
                <AvatarFallback>
                  {(post.author.displayName || post.author.username || "U")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <UserHoverPreview
                    username={post.author.username}
                    fallbackName={post.author.displayName || post.author.username}
                    className="text-sm font-semibold leading-tight truncate hover:underline cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground truncate">@{post.author.username}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/90 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          </div>
        ))}

        {!isLoading && activeTab === "trending" && trendingPosts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {t("search.inProgress")}
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}
