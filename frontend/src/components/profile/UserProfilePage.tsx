import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { useI18n } from "@/contexts/I18nContext"
import { formatRelativeTime } from "@/lib/time"
import type { PaginatedResponse, Post, User } from "@/types/api"
import { PostCard } from "@/components/feed/PostCard"

type UserProfilePageProps = {
  username: string
}

type ProfilePreviewResponse = User & {
  isFollowing?: boolean
}

export function UserProfilePage({ username }: UserProfilePageProps) {
  const { apiFetch } = useApi()
  const { language, t } = useI18n()
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery<ProfilePreviewResponse>({
    queryKey: ["users", "preview", username],
    queryFn: () => apiFetch(`/api/users/u/${encodeURIComponent(username)}`),
    enabled: Boolean(username),
  })

  const {
    data: postsPage,
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery<PaginatedResponse<Post>>({
    queryKey: ["posts", "user", profile?.id],
    queryFn: () => apiFetch(`/api/posts/user/${profile?.id}?limit=20`),
    enabled: Boolean(profile?.id),
  })

  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (!profile?.id) {
        throw new Error("Missing profile id")
      }

      return apiFetch(`/api/users/${profile.id}/follow`, {
        method: shouldFollow ? "POST" : "DELETE",
      })
    },
    onSuccess: (_response, shouldFollow) => {
      queryClient.setQueryData<ProfilePreviewResponse | undefined>(["users", "preview", username], (previous) => {
        if (!previous) {
          return previous
        }

        const followerCount = previous._count?.followers ?? previous.followerCount ?? 0
        const nextFollowerCount = Math.max(0, followerCount + (shouldFollow ? 1 : -1))

        return {
          ...previous,
          isFollowing: shouldFollow,
          followerCount: nextFollowerCount,
          _count: previous._count
            ? {
                ...previous._count,
                followers: nextFollowerCount,
              }
            : previous._count,
        }
      })

      queryClient.invalidateQueries({ queryKey: ["search", "users"], refetchType: "inactive" })
      queryClient.invalidateQueries({ queryKey: ["users", "followers"], refetchType: "inactive" })
      queryClient.invalidateQueries({ queryKey: ["users", "following"], refetchType: "inactive" })
    },
  })

  const posts = useMemo(() => postsPage?.data || [], [postsPage])

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="px-6 py-8 text-sm text-red-600">
        {profileError instanceof Error ? profileError.message : t("common.unknownError")}
      </div>
    )
  }

  const displayName = profile.displayName || profile.username || "User"
  const followerCount = profile._count?.followers ?? profile.followerCount ?? 0
  const followingCount = profile._count?.following ?? profile.followingCount ?? 0
  const isFollowing = Boolean(profile.isFollowing)

  return (
    <div className="flex flex-col w-full">
      <div className="px-6 pt-6 pb-5 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-tight">{displayName}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio ? <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap">{profile.bio}</p> : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {followerCount.toLocaleString()} {t("profile.followers")} · {followingCount.toLocaleString()} {t("profile.following")}
            </p>
          </div>
          <Avatar className="w-16 h-16 border-2 border-border shrink-0">
            <AvatarImage src={profile.avatar || profile.imageUrl || undefined} />
            <AvatarFallback>{displayName[0] || "U"}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            className="rounded-full px-4"
            onClick={() => followMutation.mutate(!isFollowing)}
            disabled={followMutation.isPending}
          >
            {isFollowing ? t("search.following") : t("search.follow")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col">
        {isPostsLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}

        {!isPostsLoading && postsError && (
          <div className="px-6 py-8 text-sm text-red-600">
            {postsError instanceof Error ? postsError.message : t("common.unknownError")}
          </div>
        )}

        {!isPostsLoading && !postsError && posts.length === 0 && (
          <div className="px-6 py-8 text-sm text-muted-foreground">{t("profile.posts.empty")}</div>
        )}

        {!isPostsLoading && !postsError && posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            author={{
              name: post.author.displayName || post.author.username || t("common.anonymous"),
              username: post.author.username || "unknown",
              avatar: post.author.avatar || post.author.imageUrl || `https://ui-avatars.com/api/?name=${post.author.username || "User"}`,
              isVerified: post.author.isVerified,
            }}
            content={post.content}
            imageUrls={post.imageUrls}
            timestamp={formatRelativeTime(post.createdAt, language, t)}
            likes={post.likeCount}
            comments={post.commentCount}
            showActions={false}
          />
        ))}

        <div className="h-16" />
      </div>
    </div>
  )
}
