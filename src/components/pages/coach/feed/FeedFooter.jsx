import {
  Bookmark,
  Heart,
  MessageCircle,
  Share
} from "lucide-react";

export default function FeedFooter() {
  return <div className="bg-white text[var(--dark-3)] px-4 py-3 flex items-center gap-2">
    <Heart className="w-[20px] h-[20px] cursor-pointer" />
    <MessageCircle className="w-[20px] h-[20px] cursor-pointer" />
    <Share className="w-[20px] h-[20px] cursor-pointer" />
    <Bookmark className="w-[20px] h-[20px] ml-auto cursor-pointer" />
  </div>
}