import { ClipboardList, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return <div className="content-container content-height-screen flex flex-col items-center justify-center">
    <div className="max-w-[450px]">
      <h4 className="w-full text-center pb-2 border-b-1">Workout</h4>
      <div className="mt-8 flex items-center gap-4">
        <Link href="/coach/workouts/add" className="bg-[var(--comp-1)] font-bold text-[14px] p-4 rounded-[8px] border-1 border-[var(--accent-1)]">
          <PlusCircle className="w-[64px] h-[64px] bg-[var(--accent-1)]/40 text-white p-3 mx-auto mb-2 rounded-full" fill="#67BC2A" />
          Create New Workout
        </Link>
        <Link href="/coach/workouts/list" className="bg-[var(--comp-1)] font-bold text-[14px] p-4 rounded-[8px] border-1 border-[var(--accent-1)]">
          <ClipboardList className="w-[64px] h-[64px] bg-[var(--accent-1)]/40 text-white p-3 mx-auto mb-2 rounded-full" fill="#67BC2A" />
          View Your Workout
        </Link>
      </div>
    </div>
  </div>
}