"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import ActivityTool from "@/components/pages/coach/dashboard/ActivityTool";
import Stories from "@/components/pages/coach/dashboard/Stories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClientHome, getMarathonLeaderBoard } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import { useAppSelector } from "@/providers/global/hooks";
import { GlassWater, Plus, PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

export default function Page() {
  return <div className="mt-8">
    <Container />
  </div>
}

function Container() {
  const { _id } = useAppSelector(state => state.client.data)
  const client = useAppSelector(state => state.client.data)
  const { isLoading, error, data } = useSWR("clientHome", () => getClientHome(_id));

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const clientHomeData = data.data;

  return <>
    <ActivityTool activities={clientHomeData.programs} />
    {/* <div className="mty-8 grid grid-cols-2 gap-4">
      <div className="bg-[var(--primary-1)] p-4 border-1 rounded-[12px]">
        <h3>Goal</h3>
        <p className="text-[var(--dark-1)]/40 mt-2">{clientHomeData?.user?.goal}</p>
      </div>
      <div className="bg-[var(--primary-1)] p-4 border-1 rounded-[12px]">
        <h3>Water Intake</h3>
        <div className="mt-4 flex gap-4 justify-between">
          <div className="w-fit grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => i).map(item => <GlassWater className="w-[32px] h-[32px] text-blue-800" fill="#193cb88D" key={item} />)}
          </div>
          <PlusCircle className="w-[32px] h-[32px] text-[var(--accent-1)] cursor-pointer" />
          <div className="w-fit grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => i).map(item => <GlassWater className="w-[32px] h-[32px] text-blue-600" key={item} />)}
          </div>
        </div>
      </div>
    </div> */}
    <div className="grid grid-cols-2 gap-4">
      <Stories stories={clientHomeData.story} />
      <div className="bg-[var(--primary-1)] mt-8 p-4 border-1 rounded-[12px]">
        <Image
          alt=""
          height={400}
          width={400}
          src={clientHomeData?.meal?.image}
          className="w-full max-h-[300px] object-contain object-center"
        />
        <h3 className="my-2">{clientHomeData?.meal?.name}</h3>
        <p>{clientHomeData?.meal?.description}</p>
      </div>
    </div>
    {/* <DashboardClientList
      topPerformers={clientHomeData.topPerformers}
      fourClients={clientHomeData.fourClients}
    /> */}
  </>
}

function getBgColor(index) {
  switch (index) {
    case 0:
      return "bg-[#FFDA47]";
    case 1:
      return "bg-[#F1EAEA]";
    case 2:
      return "bg-[#D7A07C]";

    default:
      return "bg-[var(--comp-1)]";
  }
}

function MarathonLeaderBoard() {
  const router = useRouter();
  const { cache } = useSWRConfig();
  const { isLoading, error, data } = useSWR(`app/marathon-points/monthly`, () => getMarathonLeaderBoard(null, router, cache));

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const clients = data.data;
  return <div className="content-container max-h-[50vh] overflow-y-auto">
    <div className="flex items-center gap-4">
      <h4 className="leading-[1] mb-4 mr-auto">Marathon Leaderboard</h4>
    </div>
    <div>
      {clients.map((client, index) => <div
        className={`mb-4 p-4 flex items-center gap-4 border-1 rounded-[10px] ${getBgColor(index)}`}
        key={index}>
        <span>{index + 1}</span>
        <Avatar>
          <AvatarImage src={client.client.profilePhoto} />
          <AvatarFallback>{nameInitials(client.client.name)}</AvatarFallback>
        </Avatar>
        <h3>{client.client.name}</h3>
        <p className="ml-auto">{client.totalPointsInRange}&nbsp;pts</p>
      </div>)}
    </div>
  </div>;
}