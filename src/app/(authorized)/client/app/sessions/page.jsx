"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import YouTubeEmbed from "@/components/common/YoutubeEmbed";
import { getWzSessions } from "@/lib/fetchers/app";
import { format } from "date-fns";
import useSWR from "swr";
import {UserRoundCog, MousePointer2} from "lucide-react"

export default function Page() {
  const { isLoading, error, data } = useSWR("wzsessions", () => getWzSessions("client"));

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const sessions = data.data;

  return <div className="content-container content-height-screen">
    <h4 className="mb-6 text-gray-600 text-2xl ml-2">Sessions</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
      {sessions.map(session => <div key={session._id} className="rounded-xl shadow-lg px-4 py-4 md:px-6 md:py-6 ring-1 ring-zinc-100 shadow-zinc-300 hover:shadow-2xl">
        <div className="max-h-[40vh] mb-4 rounded-2xl overflow-hidden">
          <YouTubeEmbed link={session.videoUrl} />
        </div>
        <div className="flex flex-col gap-2 justify-between">
        <div>
            <h2 className="text-base mb-1 text-zinc-600">{session.name}</h2>
            <p className="text-sm text-zinc-400 font-medium">{session.day},&nbsps;{format(session.date, "MMM d, yyyy 'at' hh:mm a")}</p>
        </div>
        <div className="flex gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-1 items-center justify-start">
              <span className="text-sm md:text-sm text-gray-400 py-[2px] font-medium flex items-center justify-start gap-1">
                <UserRoundCog className="text-gray-400 w-4"/>
                <p>Trainer</p>
              </span>
              <span className="text-sm md:text-sm xl:text-xs 2xl:text-sm text-zinc-600 font-medium italic">{session.trainerName}</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center justify-start">
              <span className="text-sm md:text-sm text-gray-400 py-[2px] font-medium flex items-center justify-start gap-1">
                <MousePointer2 className="text-gray-400 w-4"/>
                <p>Type</p>
              </span>
              <span className="text-sm md:text-sm xl:text-xs 2xl:text-sm text-zinc-600 font-medium italic">{session.workoutType}</span>
            </div>
        </div>
        </div>
      </div>)}
    </div>
  </div>
}