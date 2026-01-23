"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import DashboardFeaturesDetails from "@/components/drawers/DashboardFeaturesDetails";
// import ActivityTool from "@/components/pages/coach/dashboard/ActivityTool"; // Commented out - carousel not needed
import StatisticsCards from "@/components/pages/coach/dashboard/StatisticsCards";
import Stories from "@/components/pages/coach/dashboard/Stories";
import AnalyticsOverview from "@/components/pages/coach/dashboard/AnalyticsOverview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCoachHome } from "@/lib/fetchers/app";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { nameInitials } from "@/lib/formatter";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

export default function Page() {
  return <div className="mt-8">
    <Container />
  </div>
}

function Container() {
  const { cache } = useSWRConfig();
  const router = useRouter();
  const { isLoading, error, data } = useSWR("coachHomeTrial", () => getCoachHome(cache, router));

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />
  const coachHomeData = data.data;
  return <>
    {/* Carousel commented out - not needed for academy */}
    {/* <ActivityTool activities={coachHomeData.activePrograms} /> */}
    <StatisticsCards />
    
    {/* Analytics Overview and Results - Better spacing */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2">
        <Stories stories={coachHomeData.story} coach={true} />
      </div>
      <div className="lg:col-span-3">
        <AnalyticsOverview />
      </div>
    </div>
    <DashboardFeaturesDetails
      topPerformers={coachHomeData.topPerformers}
      clientFollowUps={coachHomeData.clientFollowUps}
      missingFollowups={coachHomeData.missingFollowups}
    />
  </>
}

function TopPerformersPreview({ topPerformers = [] }) {
  const router = useRouter();
  const topThree = Array.isArray(topPerformers) ? topPerformers.slice(0, 3) : [];

  return (
    <div className="content-container max-h-[50vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[var(--accent-1)]" />
          <h4 className="leading-[1]">Top Performers</h4>
        </div>
        {topPerformers.length > 3 && (
          <Link
            href="/coach/clients"
            className="text-sm text-[var(--accent-1)] hover:underline font-semibold"
          >
            View All
          </Link>
        )}
      </div>
      {topThree.length > 0 ? (
        <div className="space-y-3">
          {topThree.map((client, index) => (
            <Link
              key={client.clientId || index}
              href={`/coach/clients/${client._id || client.clientId}`}
              className="block"
            >
              <div className="p-4 flex items-center gap-4 border-1 rounded-[10px] bg-[var(--comp-1)] hover:bg-[var(--comp-2)] transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-1)] text-white font-bold text-sm">
                  {index + 1}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={client.profilePhoto} />
                  <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                  {client.clientId && (
                    <p className="text-xs text-[var(--dark-2)]">ID: {client.clientId}</p>
                  )}
                </div>
                <Trophy className={`w-5 h-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="w-12 h-12 text-[var(--dark-2)]/30 mb-2" />
          <p className="text-sm text-[var(--dark-2)]">No top performers yet</p>
          <p className="text-xs text-[var(--dark-2)]/70 mt-1">Start tracking client progress to see top performers</p>
        </div>
      )}
    </div>
  );
}