import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import NoData from "@/components/common/NoData";
import YouTubeEmbed from "@/components/common/YoutubeEmbed";
import FeedComments from "@/components/pages/coach/feed/FeedComments";
import FeedFooter from "@/components/pages/coach/feed/FeedFooter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { pageEnd } from "@/config/state-reducers/feed";
import { getAppFeeds } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

export default function ClientFeeds() {
  const { dispatch, ...state } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR(
    `app/getAppFeeds?page=${state.page}&type=${state.type}`,
    () => getAppFeeds(state, "client")
  );
  const mountedRef = useRef(false);
  useEffect(function () {
    if (data?.status_code === 201 && mountedRef.current && state.page !== 0) {
      dispatch(pageEnd(state.page - 1))
    }
    mountedRef.current = true;
  }, [isLoading]);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} className="!mt-0 border-0 border-b-1 rounded-none" />
  const feeds = data.data;

  if (feeds.length === 0) return <div className="min-h-[400px] mx-auto !mt-0 flex items-center border-b-1">
    <NoData message="No Posts Available" />
  </div>

  return <>
    {feeds.map((feed, index) => <ClientFeed
      key={index}
      feeds={feeds}
      feed={feed}
    />)}
  </>
}

export function ClientFeed({
  feeds,
  feed
}) {
  const [commentsOpened, setCommentsOpened] = useState(false);
  return (
    <article className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
      <FeedHeader feed={feed} />
      <div>
        {feed.contentType === "img" ? (
          <FeedImage images={feed.images} />
        ) : (
          <FeedVideo video={feed.video} />
        )}
        <FeedFooter
          feeds={feeds}
          feed={feed}
          setCommentsOpened={setCommentsOpened}
        />
      </div>
      {commentsOpened && (
        <div className="border-t border-gray-100">
          <FeedComments
            commentsOpened={commentsOpened}
            setCommentsOpened={setCommentsOpened}
            postId={feed.postId}
          />
        </div>
      )}
    </article>
  );
}

function FeedImage({ images }) {
  return (
    <div className="relative bg-black">
      <div className="w-full aspect-[4/5] overflow-hidden">
        <Image
          src={images?.at(0) || "/not-found.png"}
          fill
          alt=""
          className="object-cover"
        />
      </div>
    </div>
  );
}

function FeedVideo({ video }) {
  return <div className="relative aspect-[4/3] bg-black border-y-1">
    <YouTubeEmbed link={video} />
  </div>
}

function FeedHeader({ feed }) {
  return <div className="bg-white px-4 py-3 flex items-center shadow-md shadow-gray-200 rounded-t-2xl gap-2">
    <Avatar className="p-[2px] ring-2 ring-[var(--accent-1)]">
      <AvatarImage src={feed.userImg} />
      <AvatarFallback className={"bg-[var(--accent-1)] text-white text-sm font-semibold"}>{nameInitials(feed.userName)}</AvatarFallback>
    </Avatar>
    <p className="text-base font-bold text-gray-700 ml-2">{feed.userName}</p>
  </div>
}