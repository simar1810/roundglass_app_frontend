import { Button } from "@/components/ui/button";
import { Globe, Users } from "lucide-react";

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
        + New Post
      </Button>
    </div>
  </div>
}