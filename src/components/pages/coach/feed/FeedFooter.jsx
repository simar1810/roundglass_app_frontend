import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import {
  Bookmark,
  Heart,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function FeedFooter({
  feeds,
  feed,
  setCommentsOpened
}) {
  const { page, type } = useCurrentStateContext();

  async function likeDislike(status) {
    try {
      const data = {
        postId: feed.postId,
        like: status
      }
      await sendData("app/feedActivity", data, "POST");
      mutate(
        `app/getAppFeeds?page=${page}&type=${type}`,
        generateMutatePayload(feeds, feed.postId, "isLikedByMe")
      )
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    }
  }

  async function saveUnsave(status) {
    try {
      const data = {
        postId: feed.postId,
        save: status
      }
      await sendData("app/feedActivity", data, "POST");
      mutate(
        `app/getAppFeeds?page=${page}&type=${type}`,
        generateMutatePayload(feeds, feed.postId, "isSavedByMe")
      )
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    }
  }

  return <div className=" px-4 pb-2">
    <div className="bg-white text[var(--dark-3)] pt-3 pb-1 flex items-center gap-2">
      <Heart
        fill={feed.isLikedByMe ? "#FF1D1D" : "transparent"}
        stroke={feed.isLikedByMe ? "#FF1D1D" : "#000000"}
        className="w-[20px] h-[20px] cursor-pointer"
        onClick={() => likeDislike(!feed.isLikedByMe)}
      />
      <MessageCircle
        onClick={() => setCommentsOpened(prev => !prev)}
        className="w-[20px] h-[20px] cursor-pointer"
      />
      <Bookmark
        fill={feed.isSavedByMe ? "#000000" : "transparent"}
        stroke={feed.isSavedByMe ? "#000000" : "#000000"}
        className="w-[20px] h-[20px] ml-auto cursor-pointer"
        onClick={() => saveUnsave(!feed.isSavedByMe)}
      />
    </div>
    <p>{feed.caption}</p>
  </div>
}

function generateMutatePayload(feeds, postId, field) {
  return {
    status_code: 200,
    data: feeds.map(post => post.postId === postId ? { ...post, [field]: !post[field] } : post)
  }
}