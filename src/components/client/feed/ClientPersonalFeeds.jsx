import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import NoData from "@/components/common/NoData";
import { Button } from "@/components/ui/button";
import { changeDispalyedPostsType, pageEnd } from "@/config/state-reducers/feed";
import { getAppPersonalFeeds } from "@/lib/fetchers/app";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Bookmark, Images } from "lucide-react";
import { useEffect } from "react";
import useSWR from "swr";
import { ClientFeed } from "./ClientFeed";

export default function ClientPersonalFeeds() {
  const { dispatch, displayedPostsType, ...state } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR(
    `app/my-posts/page=${state.page}/10000000000`,
    () => getAppPersonalFeeds(state, 10000000000)
  );
  useEffect(function () {
    if (data?.status_code === 201) {
      dispatch(pageEnd(state.page - 1))
    }
  }, [isLoading]);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError
    title={error || data?.message}
    className="!mt-0 border-0 border-b-1 rounded-none"
  />

  const feeds = displayedPostsType === "saved" ? data.data.mySavedPosts : data.data.myPosts;

  if (feeds.length === 0) return <div className="min-h-[400px] border-b-1 flex items-center justify-center">
    <NoData message="No feeds Available!" />
  </div>

  return <div className="max-w-[650px] mx-auto relative rounded-t-[10px]">
    <div className="sticky top-0 bg-white rounded-t-[10px] divide-x-1 border-b-1 border-[var(--dark-1)]/10 overflow-clip z-10">
      <Button
        className={`w-1/2 text-center text-[12px] bg-transparent hover:bg-[var(--comp-1)] shadow-none rounded-none ${displayedPostsType === "myPosts" ? "text-[var(--accent-1)]" : "text-[var(--dark-2)]"}`}
        onClick={() => dispatch(changeDispalyedPostsType("myPosts"))}
      >
        <Images />
        My Posts
      </Button>
      <Button
        className={`w-1/2 text-center text-[12px] bg-transparent hover:bg-[var(--comp-1)] shadow-none rounded-none ${displayedPostsType === "mySavedPosts" ? "text-[var(--accent-1)]" : "text-[var(--dark-2)]"}`}
        onClick={() => dispatch(changeDispalyedPostsType("mySavedPosts"))}
      >
        <Bookmark />
        Saved
      </Button>
    </div>
    <>
      {feeds.map((feed, index) => <ClientFeed
        key={index}
        feeds={data.data}
        feed={feed}
      />)}
    </>
  </div>
}