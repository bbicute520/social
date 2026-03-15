import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Link2, Pencil } from "lucide-react"

type ProfileTab = "posts" | "replies" | "reposts"

const PROFILE = {
  name: "Alex Nguyen",
  username: "alexnguyen.dev",
  avatar: "https://i.pravatar.cc/300?u=profile_main",
  bio: "Full-stack dev 🚀 · Yêu thích open-source · Cà phê & code ☕\nBuilding cool stuff, one commit at a time.",
  following: 148,
  followers: 3241,
  website: "github.com/alexnguyen",
}

const MOCK_POSTS = [
  { id: "p1", content: "Mới hoàn thành feature đầu tiên cho side project 🔥 Cảm giác tuyệt vời khi code chạy đúng lần đầu!", time: "1 giờ trước", likes: 42, comments: 7 },
  { id: "p2", content: "Tip nhỏ: dùng React Query thay vì viết useEffect fetch data tay. Tốc độ dev tăng gấp đôi, bug giảm đi một nửa. 🙏", time: "2 ngày trước", likes: 178, comments: 24 },
  { id: "p3", content: "Typescript strict mode là bạn, không phải kẻ thù. Đừng set any cho tất cả mọi thứ nhé 😅", time: "5 ngày trước", likes: 92, comments: 11 },
]

const MOCK_REPLIES = [
  { id: "r1", replyTo: "@tranthib", content: "Đồng ý! Mình cũng đang dùng cách này, hiệu quả lắm 👍", time: "3 giờ trước", likes: 8 },
  { id: "r2", replyTo: "@leminhc",  content: "Bạn có thể share thêm resources về chủ đề này không?",  time: "1 ngày trước",likes: 3 },
  { id: "r3", replyTo: "@zuck",     content: "Cảm ơn sự chia sẻ! Rất hữu ích 🙌",                   time: "3 ngày trước",likes: 5 },
]

const MOCK_REPOSTS = [
  { id: "rp1", author: "Lê Minh C",   content: "Framer Motion + React = animation siêu mượt mà. Highly recommend!", time: "6 giờ trước",  likes: 235 },
  { id: "rp2", author: "Phạm Thu D",  content: "Supabase vừa ra tính năng mới, ai dùng thì update lên nhé!",        time: "2 ngày trước", likes: 67  },
]

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "posts",   label: "Bài viết" },
  { key: "replies", label: "Trả lời" },
  { key: "reposts", label: "Bài đăng lại" },
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts")

  return (
    <div className="flex flex-col w-full">
      {/* Profile Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold leading-tight">{PROFILE.name}</h2>
            <p className="text-sm text-muted-foreground">@{PROFILE.username}</p>
          </div>
          <Avatar className="w-16 h-16 border-2 border-border shadow-sm">
            <AvatarImage src={PROFILE.avatar} />
            <AvatarFallback className="text-xl font-bold">{PROFILE.name[0]}</AvatarFallback>
          </Avatar>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90 mb-3">
          {PROFILE.bio}
        </p>

        <a
          href={`https://${PROFILE.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <Link2 size={13} />
          {PROFILE.website}
        </a>

        <div className="flex items-center gap-4 mb-4 text-sm">
          <span>
            <span className="font-bold">{PROFILE.followers.toLocaleString()}</span>{" "}
            <span className="text-muted-foreground">người theo dõi</span>
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span>
            <span className="font-bold">{PROFILE.following}</span>{" "}
            <span className="text-muted-foreground">đang theo dõi</span>
          </span>
        </div>

        <Button variant="outline" size="sm" className="w-full rounded-full font-semibold gap-2 h-9">
          <Pencil size={14} />
          Chỉnh sửa trang cá nhân
        </Button>
      </div>

      {/* Tabs — sticky */}
      <div className="sticky top-0 z-10 flex bg-card/90 backdrop-blur-sm border-b border-border/50">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative
              ${activeTab === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col divide-y divide-border/40">
        {activeTab === "posts" && MOCK_POSTS.map(post => (
          <div key={post.id} className="px-5 py-4 hover:bg-muted/15 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={PROFILE.avatar} />
                <AvatarFallback>{PROFILE.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-semibold">{PROFILE.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{post.time}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed pl-11">{post.content}</p>
            <div className="flex items-center gap-4 mt-2 pl-11 text-xs text-muted-foreground">
              <span>{post.likes} thích</span>
              <span>{post.comments} bình luận</span>
            </div>
          </div>
        ))}

        {activeTab === "replies" && MOCK_REPLIES.map(reply => (
          <div key={reply.id} className="px-5 py-4 hover:bg-muted/15 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground mb-1.5">Trả lời {reply.replyTo}</p>
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={PROFILE.avatar} />
                <AvatarFallback>{PROFILE.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">{PROFILE.name}</span>
            </div>
            <p className="text-sm leading-relaxed pl-11">{reply.content}</p>
            <div className="flex items-center gap-4 mt-2 pl-11 text-xs text-muted-foreground">
              <span>{reply.likes} thích</span>
              <span>{reply.time}</span>
            </div>
          </div>
        ))}

        {activeTab === "reposts" && MOCK_REPOSTS.map(rp => (
          <div key={rp.id} className="px-5 py-4 hover:bg-muted/15 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground mb-2">
              Đăng lại từ <span className="font-medium text-foreground/80">{rp.author}</span>
            </p>
            <p className="text-sm leading-relaxed">{rp.content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{rp.likes} thích</span>
              <span>{rp.time}</span>
            </div>
          </div>
        ))}

        <div className="h-16" />
      </div>
    </div>
  )
}
