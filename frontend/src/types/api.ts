export interface ProfileLink {
  id: string
  label: string
  url: string
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface UserCount {
  followers: number
  following: number
  posts: number
}

export interface User {
  id: string
  username: string
  displayName: string | null
  imageUrl: string | null
  avatar?: string | null
  bio: string | null
  links?: ProfileLink[]
  profileLinks?: ProfileLink[]
  _count?: UserCount
  followerCount?: number
  followingCount?: number
  isVerified?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Post {
  id: string
  content: string
  imageUrls: string[]
  authorId: string
  author: User
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  isLikedByMe?: boolean
  isRepostedByMe?: boolean
}

export interface RepostPost extends Post {
  repostedAt: string
  repostId: string
}

export interface CommentPostPreview {
  id: string
  content: string
  authorId: string
  createdAt: string
}

export interface Comment {
  id: string
  content: string
  authorId: string
  author: User
  postId: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  likeCount: number
  isLikedByMe?: boolean
  post?: CommentPostPreview
}

export interface Notification {
  id: string
  recipientId: string
  actorId: string
  type: string
  postId: string | null
  commentId: string | null
  isRead: boolean
  createdAt: string
  actor: User
  post?: Post
  comment?: Comment
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
}
