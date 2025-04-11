import NoData from "@/components/common/NoData";
import { Button } from "@/components/ui/button";
import { Bookmark, Globe, Images, Plus, Users } from "lucide-react";

export default function Page() {
  return <div className="mt-8">
    <div className="flex items-center gap-4">
      <Button
        className={`text-[12px] font-bold hover:bg-[var(--accent-1)] rounded-[16px] ${true ? "bg-[var(--accent-1)] text-white" : "bg-[var(--dark-1)]/10 text-[var(--dark-2)]"}`}
      >
        <Users />
        My Community
      </Button>
      <Button
        className={`text-[12px] font-bold hover:bg-[var(--accent-1)] hover:text-white rounded-[16px] ${false ? "bg-[var(--accent-1)] text-white" : "bg-[var(--dark-1)]/10 text-[var(--dark-2)]"}`}
      >
        <Globe />
        Global Community
      </Button>
      <Button
        className="text-[12px] font-bold bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)] hover:text-white ml-auto rounded-[16px]"
      >
        <Plus />
        New Post
      </Button>
    </div>

    <div className="max-w-[650px] mt-10 mx-auto relative">
      <div className="sticky top-0 rounded-t-[10px] border-1 border-[var(--dark-1)]/10 overflow-clip">
        <Button className="w-1/2 text-center text-[var(--accent-1)] text-[12px] bg-transparent hover:bg-[var(--comp-1)] border-r-2 shadow-none rounded-none">
          <Images />
          My Posts
        </Button>
        <Button className="w-1/2 text-center text-[var(--dark-2)] text-[12px] bg-transparent hover:bg-[var(--comp-1)] border-r-2 shadow-none rounded-none">
          <Bookmark />
          My Posts
        </Button>
      </div>
    </div>

    <div className="min-h-[400px] flex items-center">
      <NoData message="No Posts Available" />
    </div>
  </div>
}