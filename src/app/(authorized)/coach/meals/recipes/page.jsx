"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import RecipeModal from "@/components/modals/RecipeModal";
import RecipeDisplayCard from "@/components/pages/coach/meals/RecipeDisplayCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FeatureCategoryTrigger from "@/features/feature-categories/components/FeatureCategoryTrigger";
import { getRecipes } from "@/lib/fetchers/app";
import { useMemo, useState } from "react";
import useSWR from "swr";

/** Sort key: prefer API dates, else Mongo ObjectId creation time, else 0. */
function recipeSortTimestamp(recipe) {
  const raw = recipe?.updatedAt ?? recipe?.createdAt ?? recipe?.date;
  if (raw) {
    const ms = new Date(raw).getTime();
    if (Number.isFinite(ms)) return ms;
  }
  const id = String(recipe?._id ?? "");
  if (id.length === 24 && /^[a-f\d]{24}$/i.test(id)) {
    const sec = parseInt(id.slice(0, 8), 16);
    if (Number.isFinite(sec)) return sec * 1000;
  }
  return 0;
}

export default function Page() {
  return <Container />
}

function Container() {
  const { isLoading, error, data } = useSWR("getRecipes", getRecipes);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const recipes = useMemo(() => {
    if (!data?.data?.length) return [];
    const q = query?.trim().toLowerCase() ?? "";
    const filtered = data.data.filter((recipe) =>
      recipe?.title?.toLowerCase()?.includes(q)
    );
    const mult = sortOrder === "newest" ? -1 : 1;
    return [...filtered].sort(
      (a, b) => mult * (recipeSortTimestamp(a) - recipeSortTimestamp(b))
    );
  }, [data?.data, query, sortOrder]);

  if (isLoading) return <ContentLoader />

  if (error || !data.success) return <ContentError title={error || data.message} />

  return <div className="content-container mt-8 md:mt-0">
    <Header
      value={query}
      onChange={(value) => setQuery(value)}
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
    />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
      {recipes.map(plan => <RecipeDisplayCard
        key={plan._id}
        plan={plan}
      />)}
    </div>
  </div>
}

function Header({ value, onChange, sortOrder, onSortChange }) {
  return (
    <div className="md:mb-4 pb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 md:border-b-1">
      <h4>Recipes</h4>
      <div className="flex flex-wrap items-center gap-2 md:gap-3 md:ml-auto">
        <Select value={sortOrder} onValueChange={onSortChange}>
          <SelectTrigger
            aria-label="Sort recipes by date"
            className="h-9 w-[min(100%,11rem)] shrink-0 bg-[var(--comp-1)] text-xs md:w-[12.5rem] md:text-sm"
          >
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
        <FormControl
          className="min-w-0 flex-1 basis-[200px] md:max-w-none md:flex-none lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px]"
          placeholder="Search Recipe.."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <RecipeModal type="new" />
        <FeatureCategoryTrigger feature="recipes" />
      </div>
    </div>
  );
}