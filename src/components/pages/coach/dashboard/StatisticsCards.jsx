import DashboardInfoCard from "@/components/cards/DashboardInfoCard";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { dashboardCards } from "@/config/data/ui";
import { dashboardStatistics } from "@/lib/fetchers/app";
import { permit } from "@/lib/permit";
import { useAppSelector } from "@/providers/global/hooks";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

export default function StatisticsCards() {
  const router = useRouter();
  const { cache } = useSWRConfig();
  const { isLoading, error, data } = useSWR("dashboardStatistics", () => dashboardStatistics(router, cache));
  const organisation = useAppSelector(state => state.coach.data.organisation);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200 || !Boolean(data)) return <ContentError
    className="!min-h-[150px]"
    title={error || data?.message || "Please try again later!"}
  />
  const statistics = data.data;

  const statsToDisplay = organisation === "Herbalife"
    ? dashboardCards.app
    : dashboardCards.app.filter(stat => stat.id !== 4)

  return <>
    <h4 className="mb-4">Overview</h4>
    <div className="grid grid-cols-5 gap-4">
      {statsToDisplay.map(item => <DashboardInfoCard
        key={item.id}
        trendUp={Math.random() > 0.5}
        quantity={statistics[item.name]}
        {...item}
      />)}
      <ClubCards statistics={statistics} />
    </div>
  </>
}

function ClubCards({ statistics }) {
  const roles = useAppSelector(state => state.coach.data.roles);
  const subscribed = !permit("club", roles)
  return <>
    {dashboardCards.club.map(item => <DashboardInfoCard
      key={item.id}
      trendUp={Math.random() > 0.5}
      quantity={statistics[item.name]}
      isSubscribed={subscribed}
      {...item}
    />)}
  </>
}