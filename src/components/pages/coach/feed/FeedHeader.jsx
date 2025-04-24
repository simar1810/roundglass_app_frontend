import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";
import { Ellipsis } from "lucide-react";

export default function FeedHeader({ feed }) {
  return <div className="bg-white px-4 py-2 flex items-center gap-2">
    <Avatar className="p-[2px] border-1">
      <AvatarImage src={feed.userImg} />
      <AvatarFallback>{nameInitials(feed.userName)}</AvatarFallback>
    </Avatar>
    <p>{feed.userName}</p>
    <Ellipsis className="ml-auto cursor-pointer" />
  </div>
}