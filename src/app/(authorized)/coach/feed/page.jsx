"use client";
import AddPostModal from "@/components/modals/AddPostmodal";
import Feeds from "@/components/pages/coach/feed/Feeds";
import { Button } from "@/components/ui/button";
import { feedDataInitialState } from "@/config/state-data/feed";
import { changeDispalyedPostsType, changeFeedType, feedReducer } from "@/config/state-reducers/feed";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Bookmark, Globe, Images, Users } from "lucide-react";

export default function Page() {
  return <CurrentStateProvider
    state={feedDataInitialState}
    reducer={feedReducer}
  >
    <div className="mt-8">
      <Header />
      <FeedContainer />
    </div>
  </CurrentStateProvider>
}

function Header() {
  const { dispatch, type } = useCurrentStateContext();

  return <div className="flex items-center gap-4">
    <Button
      className={`text-[12px] font-bold hover:bg-[var(--accent-1)] hover:text-white rounded-[16px] ${type === "our" ? "bg-[var(--accent-1)] text-white" : "bg-[var(--dark-1)]/10 text-[var(--dark-2)]"}`}
      onClick={() => dispatch(changeFeedType("our"))}
    >
      <Users />
      My Community
    </Button>
    <Button
      className={`text-[12px] font-bold hover:bg-[var(--accent-1)] hover:text-white rounded-[16px] ${type === "global" ? "bg-[var(--accent-1)] text-white" : "bg-[var(--dark-1)]/10 text-[var(--dark-2)]"}`}
      onClick={() => dispatch(changeFeedType("global"))}
    >
      <Globe />
      Global Community
    </Button>
    <AddPostModal />
  </div>
}

function FeedContainer() {
  const { displayedPostsType, dispatch } = useCurrentStateContext()

  return <div className="max-w-[650px] bg-white mt-10 mx-auto relative border-1 border-b-0 rounded-t-[10px]">
    <div className="sticky top-0 rounded-t-[10px] divide-x-1 border-b-1 border-[var(--dark-1)]/10 overflow-clip">
      <Button
        className={`w-1/2 text-center text-[12px] bg-transparent hover:bg-[var(--comp-1)] shadow-none rounded-none ${displayedPostsType === "all" ? "text-[var(--accent-1)]" : "text-[var(--dark-2)]"}`}
        onClick={() => dispatch(changeDispalyedPostsType("all"))}
      >
        <Images />
        My Posts
      </Button>
      <Button
        className={`w-1/2 text-center text-[12px] bg-transparent hover:bg-[var(--comp-1)] shadow-none rounded-none ${displayedPostsType === "saved" ? "text-[var(--accent-1)]" : "text-[var(--dark-2)]"}`}
        onClick={() => dispatch(changeDispalyedPostsType("saved"))}
      >
        <Bookmark />
        My Posts
      </Button>
    </div>
    <Feeds />
  </div>
}