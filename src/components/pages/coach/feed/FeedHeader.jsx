import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import { Ellipsis } from "lucide-react";

export default function FeedHeader() {
  return <div className="bg-white px-4 py-2 flex items-center gap-2">
    <Avatar className="p-[2px] border-1">
      <AvatarImage src="/image" />
      <AvatarFallback>US</AvatarFallback>
    </Avatar>
    <p>Lacy</p>
    <Ellipsis className="ml-auto cursor-pointer" />
  </div>
}