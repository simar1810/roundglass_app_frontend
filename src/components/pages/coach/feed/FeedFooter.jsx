import {
  Bookmark,
  Heart,
  MessageCircle,
  Share
} from "lucide-react";

export default function FeedFooter({ feed }) {
  return <div className=" px-4 pb-2">
    <div className="bg-white text[var(--dark-3)] pt-3 pb-1 flex items-center gap-2">
      <Heart
        fill={feed.isLikedByMe ? "#FF1D1D" : "transparent"}
        stroke={feed.isLikedByMe ? "#FF1D1D" : "#000000"}
        className="w-[20px] h-[20px] cursor-pointer"
      />
      <MessageCircle className="w-[20px] h-[20px] cursor-pointer" />
      <Bookmark
        fill={feed.isSavedByMe ? "#000000" : "transparent"}
        stroke={feed.isSavedByMe ? "#000000" : "#000000"}
        className="w-[20px] h-[20px] ml-auto cursor-pointer"
      />
    </div>
    <p>{feed.caption}</p>
  </div>
}