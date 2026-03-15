import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type SearchTab = "suggested" | "trending" | "people"

const SEARCH_TABS: { key: SearchTab; label: string }[] = [
  { key: "suggested", label: "Gợi ý" },
  { key: "trending",  label: "Xu hướng" },
  { key: "people",    label: "Tài khoản" },
]

const SUGGESTED_USERS = [
  { id: "1", name: "Nguyễn Văn A", username: "nguyenvana", avatar: "https://i.pravatar.cc/150?u=u1", followers: "12,4K" },
  { id: "2", name: "Trần Thị B",   username: "tranthib",   avatar: "https://i.pravatar.cc/150?u=u2", followers: "8,2K"  },
  { id: "3", name: "Lê Minh C",    username: "leminhc",    avatar: "https://i.pravatar.cc/150?u=u3", followers: "34,1K" },
  { id: "4", name: "Phạm Thu D",   username: "phamthud",   avatar: "https://i.pravatar.cc/150?u=u4", followers: "5,7K"  },
  { id: "5", name: "Hoàng Anh E",  username: "hoanganhe",  avatar: "https://i.pravatar.cc/150?u=u5", followers: "21,9K" },
]

const TRENDING = [
  { tag: "Vietnam",     posts: "24,5K bài viết" },
  { tag: "ThreadsClone",posts: "8,1K bài viết"  },
  { tag: "ReactJS",     posts: "15,3K bài viết" },
  { tag: "TechViet",    posts: "6,9K bài viết"  },
  { tag: "DevLife",     posts: "11,2K bài viết" },
  { tag: "OpenSource",  posts: "9,4K bài viết"  },
]

const ALL_PEOPLE = [
  ...SUGGESTED_USERS,
  { id: "6", name: "Minh Khoa F",  username: "minhkhoaf",  avatar: "https://i.pravatar.cc/150?u=u6", followers: "3,1K" },
  { id: "7", name: "Thanh Tâm G",  username: "thanhtamg",  avatar: "https://i.pravatar.cc/150?u=u7", followers: "7,8K" },
]

export function SearchPage() {
  const [query, setQuery]       = useState("")
  const [activeTab, setActiveTab] = useState<SearchTab>("suggested")
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  const toggleFollow = (id: string) => {
    setFollowed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredPeople = ALL_PEOPLE.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase())
  )

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
              placeholder="Tìm kiếm người dùng, hashtag..."
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
        {(activeTab === "suggested" ? SUGGESTED_USERS : activeTab === "people" ? filteredPeople : []).map(user => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/15 transition-colors"
          >
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.followers} người theo dõi</p>
            </div>
            <Button
              size="sm"
              variant={followed.has(user.id) ? "outline" : "default"}
              onClick={() => toggleFollow(user.id)}
              className="rounded-full text-xs h-8 px-4 shrink-0"
            >
              {followed.has(user.id) ? "Đang theo dõi" : "Theo dõi"}
            </Button>
          </div>
        ))}

        {activeTab === "trending" && TRENDING.map(item => (
          <div
            key={item.tag}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-sm font-semibold">#{item.tag}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.posts}</p>
            </div>
          </div>
        ))}

        <div className="h-16" />
      </div>
    </div>
  )
}
