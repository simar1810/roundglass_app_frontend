import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendData } from "@/lib/api";
import { getFeedComments } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function FeedComments({ postId }) {
  const { isLoading, error, data } = useSWR(`app/get-comments?postId=${postId}`, () => getFeedComments(postId));
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) return <div className="h-full flex items-center justify-center">
    <Loader />
  </div>

  if (error || data.status_code !== 200) return <ContentError
    className="border-0"
    title={error || data.message}
  />
  const comments = data.data;

  async function addComment() {
    try {
      if (!commentText) return;
      setLoading(true);
      const data = {
        postId,
        comment: commentText
      }
      await sendData("app/feedActivity", data, "POST");
      mutate(`app/get-comments?postId=${postId}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false);
    }
  }

  return <div className="h-full flex flex-col">
    <h4 className="bg-white p-4 sticky top-0 border-b-1 z-[20]">Comments</h4>
    <div className="p-4">
      {comments.map(comment => <Comment
        comment={comment}
        key={comment._id}
      />)}
    </div>
    <div className="w-full bg-white mt-auto sticky bottom-0 border-t-1 p-4 flex items-center gap-2">
      <Input
        placeholder="comment..."
        className="bg-[var(--comp-2)] focus:bg-[var(--comp-1)]"
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
      />
      <Button
        disabled={loading}
        onClick={addComment}
        variant="wz"
      >
        Post
      </Button>
    </div>
  </div>
}

function Comment({ comment }) {
  return <div className="mb-4 flex items-center gap-4">
    <Avatar>
      <AvatarImage src={comment.userImage} />
      <AvatarFallback>{nameInitials(comment.name)}</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-[14px] leading-[0] pt-2">{comment.name}</p>
      <p className="text-[10px] mt-2">{comment.comment}</p>
    </div>
  </div>
}