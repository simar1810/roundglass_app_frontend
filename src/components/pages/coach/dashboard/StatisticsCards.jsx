import DashboardInfoCard from "@/components/cards/DashboardInfoCard";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { dashboardCards } from "@/config/data/ui";
import { dashboardStatistics } from "@/lib/fetchers/app";
import useSWR from "swr";

export default function StatisticsCards() {
  const { isLoading, error, data } = useSWR("dashboardStatistics", dashboardStatistics);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError className="!min-h-[150px]" title={error || data.message} />
  const statistics = data.data;

  return <div className="grid grid-cols-5 gap-4">
    {dashboardCards.app.map(item => <DashboardInfoCard
      key={item.id}
      trendUp={Math.random() > 0.5}
      quantity={statistics[item.name]}
      {...item}
    />)}
  </div>
}