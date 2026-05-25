"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import MealDisplayCard from "@/components/pages/coach/meals/MealDisplayCard";
import { getPlans } from "@/lib/fetchers/app";
import { useFeatureScope } from "@/hooks/useFeatureScope";
import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("")
  const { isLoading, error, data } = useSWR("getPlans", getPlans);
  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  return <div className="content-container content-height-screen">
    <Header
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
    <MealPlanContainer
      allMealPlans={data.data}
      searchQuery={searchQuery}
    />
  </div>
}

function Header({
  searchQuery,
  setSearchQuery
}) {
  const { hasAccess: canManageIngredients } = useFeatureScope(["ingredients:read", "ingredients:manage"])
  return <div className="mb-4 pb-4 flex items-center gap-4 border-b-1">
    <h4>Meal Plans</h4>
    {canManageIngredients && (
      <Button
        variant="outline"
        size="sm"
        className="h-9 shrink-0 gap-1.5 border-[var(--accent-1)]/50 text-[11px] md:text-xs font-semibold text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10 ml-auto"
        asChild
      >
        <Link href="/coach/meals/ingredients-catalog">
          <Package className="size-3.5" aria-hidden />
          Ingredient catalog
        </Link>
      </Button>
    )}
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px]"
      placeholder="Search Meal.."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
    />
  </div>
}

function MealPlanContainer({
  allMealPlans,
  searchQuery
}) {
  const plans = allMealPlans.filter(item => new RegExp(searchQuery, "i").test(item.name));
  return <div className="grid grid-cols-4 gap-4">
    {plans.map(plan => <MealDisplayCard
      plan={plan}
      key={plan._id} />)}
  </div>
}