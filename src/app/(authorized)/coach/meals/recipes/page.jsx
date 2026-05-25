"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FeatureDisabled from "@/components/common/error/FeatureDisabled";
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
import CategoryFilterEmptyState from "@/features/feature-categories/components/CategoryFilterEmptyState";
import CategorySubcategoryFilters from "@/features/feature-categories/components/CategorySubcategoryFilters";
import FeatureCategoryTrigger from "@/features/feature-categories/components/FeatureCategoryTrigger";
import { useFeatureCategoryOptions } from "@/features/feature-categories/hooks/useFeatureCategoryOptions";
import {
  hasActiveCategoryFilters,
  matchesCategoryFilter,
} from "@/features/feature-categories/utils/filter-helpers";
import { useFeatureScope } from "@/hooks/useFeatureScope";
import { getRecipes } from "@/lib/fetchers/app";
import { Package } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";

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
  const { hasAccess } = useFeatureScope("meal_plans:manage")
  if (!hasAccess) return <FeatureDisabled />
  return <Container />
}

function Container() {
  const { isLoading, error, data } = useSWR("getRecipes", getRecipes);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");

  const { mainCategories, subCategories } = useFeatureCategoryOptions("recipes");

  const recipes = useMemo(() => {
    if (!data?.data?.length) return [];
    const q = query?.trim().toLowerCase() ?? "";
    const filtered = data.data.filter((recipe) => {
      const matchesSearch = !q || recipe?.title?.toLowerCase()?.includes(q);
      const matchesCategory = matchesCategoryFilter(recipe?.category, category);
      const matchesSubCategory = matchesCategoryFilter(recipe?.subCategory, subCategory);
      return matchesSearch && matchesCategory && matchesSubCategory;
    });

    const mult = sortOrder === "newest" ? -1 : 1;
    return [...filtered].sort(
      (a, b) => mult * (recipeSortTimestamp(a) - recipeSortTimestamp(b))
    );
  }, [data?.data, query, sortOrder, category, subCategory]);

  const hasSearch = Boolean(query?.trim());
  const hasCategoryFilters = hasActiveCategoryFilters(category, subCategory);

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setSubCategory("all");
  }

  if (isLoading) return <ContentLoader />

  if (error || !data.success) return <ContentError title={error || data.message} />

  return (
    <div className="content-container mt-6 pb-10 md:mt-0">
      <Header
        value={query}
        onChange={setQuery}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        category={category}
        onCategoryChange={setCategory}
        subCategory={subCategory}
        onSubCategoryChange={setSubCategory}
        mainCategories={mainCategories}
        subCategories={subCategories}
      />
      {recipes.length === 0 ? (
        <CategoryFilterEmptyState
          entityLabel="recipes"
          hasSearch={hasSearch}
          hasCategoryFilters={hasCategoryFilters}
          onClear={hasSearch || hasCategoryFilters ? clearFilters : undefined}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((plan) => (
            <RecipeDisplayCard key={plan._id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

function Header({
  value,
  onChange,
  sortOrder,
  onSortChange,
  category,
  onCategoryChange,
  subCategory,
  onSubCategoryChange,
  mainCategories,
  subCategories,
}) {
  const { hasAccess: canManageIngredients } = useFeatureScope(["ingredients:read", "ingredients:manage"])

  return (
    <div className="space-y-4 border-b border-border/60 pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--dark-1)] md:text-3xl">
          Recipes
        </h1>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {canManageIngredients && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5 border-[var(--accent-1)]/50 text-[11px] font-semibold text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10 md:text-xs"
              asChild
            >
              <Link href="/coach/meals/ingredients-catalog">
                <Package className="size-3.5" aria-hidden />
                Ingredient catalog
              </Link>
            </Button>
          )}
          <RecipeModal type="new" />
          <FeatureCategoryTrigger feature="recipes" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CategorySubcategoryFilters
          category={category}
          subCategory={subCategory}
          onCategoryChange={onCategoryChange}
          onSubCategoryChange={onSubCategoryChange}
          mainCategories={mainCategories}
          subCategories={subCategories}
          triggerClassName="bg-[var(--comp-1)]"
        />
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Select value={sortOrder} onValueChange={onSortChange}>
            <SelectTrigger
              aria-label="Sort recipes by date"
              className="h-9 w-full min-w-[9rem] shrink-0 bg-[var(--comp-1)] text-xs sm:w-[12.5rem] sm:text-sm"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
          <FormControl
            className="min-w-0 w-full flex-1 basis-[200px] sm:min-w-[220px] lg:max-w-[320px] [&_.input]:bg-[var(--comp-1)] [&_.input]:focus:shadow-2xl text-[12px]"
            placeholder="Search recipes..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
