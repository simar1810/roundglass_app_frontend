import Image from "next/image";
import FeedFooter from "./FeedFooter";
import FeedHeader from "./FeedHeader";
import NoData from "@/components/common/NoData";
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { getAppFeeds } from "@/lib/fetchers/app";
import ContentError from "@/components/common/ContentError";
import YouTubeEmbed from "@/components/common/YoutubeEmbed";
import { useState } from "react";
import FeedComments from "./FeedComments";

export default function Feeds() {
  const { dispatch, ...state } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR(
    `app/getAppFeeds?page=${state.page}&type=${state.type}`,
    () => getAppFeeds(state)
  );

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} className="!mt-0 border-0 border-b-1 rounded-none" />
  const feeds = data.data;

  if (feeds.length === 0) return <div className="min-h-[400px] mx-auto !mt-0 flex items-center border-b-1">
    <NoData message="No Posts Available" />
  </div>

  return <>
    {feeds.map((feed, index) => <Feed
      key={index}
      feeds={feeds}
      feed={feed}
    />)}
  </>
}

function Feed({
  feeds,
  feed
}) {
  const [commentsOpened, setCommentsOpened] = useState(false);
  return <div className="relative border-b-1 py-2">
    <div>
      <FeedHeader feed={feed} />
      {feed.contentType === "img"
        ? <FeedImage images={feed.images} />
        : <FeedVideo video={feed.video} />}
      <FeedFooter
        feeds={feeds}
        feed={feed}
        setCommentsOpened={setCommentsOpened}
      />
    </div>
    {commentsOpened && <div className={`max-w-[450px] min-w-0 h-full bg-white absolute right-0 top-0 border-1 border-[var(--accent-1)]/50 overflow-y-auto custom-scrollbar ${commentsOpened ? "w-full" : "w-0"}`}>
      <FeedComments
        commentsOpened={commentsOpened}
        postId={feed.postId}
      />
    </div>}
  </div>
}

function FeedImage({ images }) {
  return <div className="relative aspect-[7/4] bg-black border-y-1">
    <Image
      src={images?.at(0) || "/not-found.png"}
      fill
      alt=""
      className="object-cover !aspect-square"
    />
  </div>
}

function FeedVideo({ video }) {
  return <div className="relative aspect-[4/3] bg-black border-y-1">
    <YouTubeEmbed videoId={video} />
  </div>
}