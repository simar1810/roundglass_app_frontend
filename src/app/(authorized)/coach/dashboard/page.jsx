"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FollowUpList from "@/components/pages/coach/dashboard/FollowUpList";
import StatisticsCards from "@/components/pages/coach/dashboard/StatisticsCards";
import Stories from "@/components/pages/coach/dashboard/Stories";
import TopPerformers from "@/components/pages/coach/dashboard/TopPerformers";
import Tools from "@/components/pages/coach/Tools";
import { getCoachHome } from "@/lib/fetchers/app";
import useSWR from "swr";


export default function Page() {
  const { isLoading, error, data } = useSWR("coachHomeTrial", getCoachHome);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const coachHomeData = data.data;

  return <div className="mt-8">
    <StatisticsCards />
    <Stories stories={coachHomeData.story} />
    <Tools data={coachHomeData} />
    <div className="mt-8 grid grid-cols-2 gap-4">
      <TopPerformers clients={coachHomeData.topPerformers} />
      <FollowUpList clients={coachHomeData.fourClients} />
    </div>
  </div>
}