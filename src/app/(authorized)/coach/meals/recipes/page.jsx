"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import RecipeModal from "@/components/modals/RecipeModal";
import RecipeDisplayCard from "@/components/pages/coach/meals/RecipeDisplayCard";
import { Button } from "@/components/ui/button";
import { getRecipes } from "@/lib/fetchers/app";
import useSWR from "swr";

export default function Page() {
  const { isLoading, error, data } = useSWR("getRecipes", getRecipes);

  if (isLoading) return <ContentLoader />

  if (error || !data.success) return <ContentError title={error || data.message} />
  const recipes = data.data;

  return <div className="content-container mt-8">
    <Header />
    <div className="grid grid-cols-4 gap-4">
      {recipes.map(plan => <RecipeDisplayCard
        key={plan._id}
        plan={plan}
      />)}
    </div>
  </div>
}

function Header() {
  return <div className="mb-4 pb-4 flex items-center gap-4 border-b-1">
    <h4>Recipes</h4>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
      placeholder="Search Recipe.."
    />
    <RecipeModal type="new" />
  </div>
}