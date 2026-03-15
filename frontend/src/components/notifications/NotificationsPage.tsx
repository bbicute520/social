import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type FilterKey = "all" | "replies" | "mentions" | "follows" | "requests"

interface Notification {
  id: string
  avatar: string
  name: string
  content: string
  time: string
  isRead: boolean
}

const DATA: Record<FilterKey, Notification[]> = {
  all: [
    { id: "a1", avatar: "https://i.pravatar.cc/150?u=n1", name: "Minh Tú",    content: "đã thích bài viết của bạn.",                  time: "2 giờ trước",   isRead: false },
    { id: "a2", avatar: "https://i.pravatar.cc/150?u=n2", name: "Hoa Linh",   content: "bắt đầu theo dõi bạn.",                       time: "4 giờ trước",   isRead: false },
    { id: "a3", avatar: "https://i.pravatar.cc/150?u=n3", name: "Kiên Trần",  content: "đã chia sẻ lại bài của bạn.",                 time: "1 ngày trước",  isRead: true  },
    { id: "a4", avatar: "https://i.pravatar.cc/150?u=n4", name: "Thu Hà",     content: "đã thích bình luận của bạn.",                 time: "2 ngày trước",  isRead: true  },
    { id: "a5", avatar: "https://i.pravatar.cc/150?u=n5", name: "Bảo Nam",    content: "đã nhắc đến bạn trong một chủ đề.",           time: "3 ngày trước",  isRead: true  },
  ],
  replies: [
    { id: "r1", avatar: "https://i.pravatar.cc/150?u=n6", name: "Lan Anh",    content: "đã trả lời: \"Tuyệt vời quá! 🔥\"",           time: "1 giờ trước",   isRead: false },
    { id: "r2", avatar: "https://i.pravatar.cc/150?u=n7", name: "Đức Huy",    content: "đã trả lời: \"Mình đồng ý quan điểm này.\"",  time: "5 giờ trước",   isRead: false },
    { id: "r3", avatar: "https://i.pravatar.cc/150?u=n8", name: "Yến Nhi",    content: "đã trả lời: \"Có thể giải thích thêm không?\"",time: "1 ngày trước",  isRead: true  },
    { id: "r4", avatar: "https://i.pravatar.cc/150?u=n9", name: "Quang Vinh", content: "đã trả lời bình luận của bạn.",               time: "2 ngày trước",  isRead: true  },
    { id: "r5", avatar: "https://i.pravatar.cc/150?u=na", name: "Mai Phương", content: "đã trả lời: \"Cảm ơn bạn 🙏\"",              time: "4 ngày trước",  isRead: true  },
  ],
  mentions: [
    { id: "m1", avatar: "https://i.pravatar.cc/150?u=nb", name: "Gia Bảo",    content: "đã nhắc đến bạn: \"...chúc mừng @you!\"",    time: "3 giờ trước",   isRead: false },
    { id: "m2", avatar: "https://i.pravatar.cc/150?u=nc", name: "Thùy Dương", content: "đã tag bạn trong một bài viết.",              time: "8 giờ trước",   isRead: true  },
    { id: "m3", avatar: "https://i.pravatar.cc/150?u=nd", name: "Nhật Hào",   content: "đã nhắc đến bạn trong chủ đề trending.",     time: "1 ngày trước",  isRead: true  },
    { id: "m4", avatar: "https://i.pravatar.cc/150?u=ne", name: "Diệu Linh",  content: "đã tag bạn: \"Bạn nghĩ sao @you?\"",          time: "3 ngày trước",  isRead: true  },
    { id: "m5", avatar: "https://i.pravatar.cc/150?u=nf", name: "Hoàng Long", content: "nhắc tên bạn trong một cuộc trò chuyện.",    time: "5 ngày trước",  isRead: true  },
  ],
  follows: [
    { id: "f1", avatar: "https://i.pravatar.cc/150?u=ng", name: "Trúc Lâm",   content: "bắt đầu theo dõi bạn.",                      time: "30 phút trước", isRead: false },
    { id: "f2", avatar: "https://i.pravatar.cc/150?u=nh", name: "Phú Tài",    content: "bắt đầu theo dõi bạn.",                      time: "2 giờ trước",   isRead: false },
    { id: "f3", avatar: "https://i.pravatar.cc/150?u=ni", name: "Thu Thảo",   content: "bắt đầu theo dõi bạn.",                      time: "1 ngày trước",  isRead: true  },
    { id: "f4", avatar: "https://i.pravatar.cc/150?u=nj", name: "Bình An",    content: "bắt đầu theo dõi bạn.",                      time: "4 ngày trước",  isRead: true  },
    { id: "f5", avatar: "https://i.pravatar.cc/150?u=nk", name: "Vy Nguyễn",  content: "bắt đầu theo dõi bạn.",                      time: "1 tuần trước",  isRead: true  },
  ],
  requests: [
    { id: "q1", avatar: "https://i.pravatar.cc/150?u=nl", name: "Ẩn danh",    content: "muốn theo dõi bạn. Bạn có muốn chấp nhận?",  time: "1 giờ trước",   isRead: false },
    { id: "q2", avatar: "https://i.pravatar.cc/150?u=nm", name: "user_9821",  content: "gửi yêu cầu theo dõi tài khoản của bạn.",    time: "3 giờ trước",   isRead: true  },
    { id: "q3", avatar: "https://i.pravatar.cc/150?u=nn", name: "new_acc_23", content: "muốn theo dõi bạn.",                          time: "1 ngày trước",  isRead: true  },
  ],
}

interface NotificationsPageProps {
  activeFilter?: string
}

export function NotificationsPage({ activeFilter = "all" }: NotificationsPageProps) {
  const items = DATA[activeFilter as FilterKey] ?? DATA.all

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col divide-y divide-border/40">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer"
          >
            <div className="relative shrink-0">
              <Avatar className="w-10 h-10">
                <AvatarImage src={item.avatar} />
                <AvatarFallback>{item.name[0]}</AvatarFallback>
              </Avatar>
              {!item.isRead && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-card" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-semibold">{item.name}</span>{" "}
                <span className="text-muted-foreground">{item.content}</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{item.time}</p>
            </div>

            {activeFilter === "follows" && (
              <button className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:bg-muted/30 transition-colors">
                Theo dõi lại
              </button>
            )}
            {activeFilter === "requests" && (
              <div className="shrink-0 flex gap-1.5">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
                  Chấp nhận
                </button>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:bg-muted/30 transition-colors">
                  Từ chối
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="h-16" />
      </div>
    </div>
  )
}
