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
  const { organisation } = useAppSelector(state => state.coach.data);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200 || !Boolean(data)) return <ContentError
    className="!min-h-[150px]"
    title={error || data?.message || "Please try again later!"}
  />
  const statistics = data.data;
  const appCardsBase = dashboardCards.app.filter(item => item.id !== 1); // remove "Active Players"
  const appCards = organisation !== "Herbalife"
    ? appCardsBase.filter(item => item.id !== 4) // hide "Orders" for non-Herbalife
    : appCardsBase
  return <>
    <h4 className="mb-4">Overview</h4>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {appCards.map(item => <DashboardInfoCard
        key={item.id}
        trendUp={Math.random() > 0.5}
        quantity={statistics[item.name]}
        {...item}
      />)}
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