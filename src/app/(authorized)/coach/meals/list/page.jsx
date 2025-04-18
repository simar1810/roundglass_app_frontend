"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import MealDisplayCard from "@/components/pages/coach/meals/MealDisplayCard";
import { Button } from "@/components/ui/button";
import { getPlans } from "@/lib/fetchers/app";
import useSWR from "swr";

export default function Page() {
  const { isLoading, error, data } = useSWR("getPlans", getPlans);
  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || error.message} />

  const plans = data.data;

  return <div className="mt-8">
    <Header />
    <div className="grid grid-cols-4 gap-4">
      {plans.map(plan => <MealDisplayCard
        plan={plan}
        key={plan._id} />)}
    </div>
  </div>
}

function Header() {
  return <div className="mb-4 pb-4 flex items-center gap-4 border-b-1">
    <h4>Meal Plans</h4>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
      placeholder="Search Meal.."
    />
  </div>
}