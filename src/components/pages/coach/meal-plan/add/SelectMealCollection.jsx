import ContentLoader from "@/components/common/ContentLoader";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import { fetchData } from "@/lib/api";
import { getRecipes } from "@/lib/fetchers/app";
import {
  applyDefaultServingNutrition,
  getServingNutrition,
  buildPer100gSnapshot,
  formatServingSizeLabel,
} from "@/lib/nutrition/per100g";
import { cn } from "@/lib/utils";
import { Flame, PlusCircle, Search, Star, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";


import { toggleFavoriteRecipe } from "@/lib/fetchers/app";

export default function SelectMealCollection({
  children,
  selectedDay,
  selectedMealType,
  index,
  open,
  onOpenChange,
  onCreateCustomMeal,
  onOpenCreateRecipe,
  onMealSelected,
  dialogTitle = "Add Meals",
  continueLabel = "Continue",
}) {
  const isControlled = open !== undefined;

  return (
    <Dialog
      open={isControlled ? open : undefined}
      onOpenChange={isControlled ? onOpenChange : undefined}
    >
      {children}
      {!children && (
        <DialogTrigger className="w-full mt-4">
          <h3 className="text-left">Select Meals</h3>
          <div className="w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]">
            <PlusCircle size={32} className="text-[var(--accent-1)]" />
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="w-full md:min-w-[850px] p-0 gap-0">
        <DialogHeader className="p-4 border-b-1">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <RecipeesContainer
          selectedDay={selectedDay}
          selectedMealType={selectedMealType}
          index={index}
          onCreateCustomMeal={onCreateCustomMeal}
          onOpenCreateRecipe={onOpenCreateRecipe}
          onMealSelected={onMealSelected}
          continueLabel={continueLabel}
        />
      </DialogContent>
    </Dialog>
  );
}

function getMealsEndpoint(query, recipeSource, isInitialLoad) {
  if (recipeSource === "favorites") return fetchData("app/getFavouriteRecipes");
  if (recipeSource === "my") return getRecipes();

  if (isInitialLoad && (!query || query.trim().length === 0)) {
    return fetchData(`app/mostSearchedRecipes?person=coach`);
  }
  if (query.length < 3) {
    return null;
  }
  return fetchData(`app/recipees?query=${query}`);
}

const RECIPE_SOURCE_OPTIONS = [
  { value: "browse", label: "Browse", icon: Search },
  { value: "my", label: "My Recipes", icon: UserRound },
  { value: "favorites", label: "Favorites", icon: Star },
];

function normalizeRecipeId(id) {
  if (!id) return "";
  if (typeof id === "object" && id.$oid) return String(id.$oid);
  return String(id);
}

function applyFavoriteToggleToCache(currentData, recipeId, { removeWhenUnfavorite = false } = {}) {
  if (!currentData?.data) return currentData;

  const id = normalizeRecipeId(recipeId);
  const match = currentData.data.find((recipe) => normalizeRecipeId(recipe._id) === id);
  if (!match) return currentData;

  const nextFavorite = !match.isFavorite;

  if (removeWhenUnfavorite && !nextFavorite) {
    return {
      ...currentData,
      data: currentData.data.filter((recipe) => normalizeRecipeId(recipe._id) !== id),
    };
  }

  return {
    ...currentData,
    data: currentData.data.map((recipe) =>
      normalizeRecipeId(recipe._id) === id ? { ...recipe, isFavorite: nextFavorite } : recipe
    ),
  };
}

function isRecipeListCacheKey(key) {
  return (
    typeof key === "string" &&
    (key.startsWith("recipees/") ||
      key === "popular-meals" ||
      key === "coach-recipes" ||
      key === "getFavouriteRecipes")
  );
}

function RecipeesContainer({
  index,
  selectedDay,
  selectedMealType,
  onCreateCustomMeal,
  onOpenCreateRecipe,
  onMealSelected,
  continueLabel = "Continue",
}) {
  const [query, setQuery] = useState("");
  const [recipeSource, setRecipeSource] = useState("browse");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const debouncedSearchQuery = useDebounce(query, 1000);

  const isQueryEmpty = !query || query.trim().length === 0;
  const endpoint =
    recipeSource === "favorites"
      ? "getFavouriteRecipes"
      : recipeSource === "my"
        ? "coach-recipes"
        : isQueryEmpty && isInitialLoad
          ? "popular-meals"
          : `recipees/${debouncedSearchQuery}`;

  const { isLoading, isValidating, error, data } = useSWR(endpoint, () =>
    getMealsEndpoint(debouncedSearchQuery, recipeSource, isInitialLoad && isQueryEmpty)
  );
  
  const [selected, setSelected] = useState();
  const closeRef = useRef();
  const searchInputRef = useRef(null);
  
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Track when user starts typing to switch from popular meals to search
  // Also reset to popular meals when query is cleared
  useEffect(() => {
    if (query.trim().length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    } else if (query.trim().length === 0 && !isInitialLoad && recipeSource === "browse") {
      setIsInitialLoad(true);
    }
  }, [query, isInitialLoad, recipeSource]);

  const handleSourceChange = (source) => {
    setRecipeSource(source);
    setQuery("");
    setIsInitialLoad(true);
  };

  const handleToggleFavorite = async (recipe) => {
    const normalizedId = normalizeRecipeId(recipe._id?.$oid || recipe._id);
    const willFavorite = !recipe.isFavorite;
    const previousEndpointData = data;

    mutate(
      endpoint,
      (current) =>
        applyFavoriteToggleToCache(current, normalizedId, {
          removeWhenUnfavorite: recipeSource === "favorites",
        }),
      { revalidate: false }
    );

    mutate(
      "getFavouriteRecipes",
      (current) => {
        const existing = Array.isArray(current?.data) ? current.data : [];
        if (willFavorite) {
          if (existing.some((item) => normalizeRecipeId(item._id) === normalizedId)) {
            return applyFavoriteToggleToCache(
              current ?? { status_code: 200, data: existing },
              normalizedId
            );
          }
          return {
            ...(current ?? { status_code: 200 }),
            data: [{ ...recipe, isFavorite: true }, ...existing],
          };
        }
        return {
          ...(current ?? { status_code: 200 }),
          data: existing.filter(
            (item) => normalizeRecipeId(item._id) !== normalizedId
          ),
        };
      },
      { revalidate: false, populateCache: true }
    );

    mutate(
      (key) => isRecipeListCacheKey(key) && key !== endpoint && key !== "getFavouriteRecipes",
      (current) => applyFavoriteToggleToCache(current, normalizedId),
      { revalidate: false }
    );

    try {
      const result = await toggleFavoriteRecipe(normalizedId);
      if (result.status_code !== 200) {
        throw new Error(result.message || "Failed to update favorite");
      }
    } catch (error) {
      mutate(endpoint, previousEndpointData, { revalidate: false });
      mutate(
        (key) => isRecipeListCacheKey(key) && key !== endpoint,
        undefined,
        { revalidate: true }
      );
      toast.error(error?.message || "Failed to update favorite");
    }
  };

  // Filter coach/favorite recipes client-side when searching within a collection
  let recipees = data?.data ?? [];
  let showPopularLabel = false;

  if (recipeSource === "my" && recipees.length > 0 && query.trim().length > 0) {
    const searchLower = query.toLowerCase();
    recipees = recipees.filter(
      (recipe) =>
        recipe?.title?.toLowerCase()?.includes(searchLower) ||
        recipe?.dish_name?.toLowerCase()?.includes(searchLower)
    );
  } else if (recipeSource === "browse" && isQueryEmpty && isInitialLoad && recipees.length > 0) {
    showPopularLabel = true;
  }

  if (recipeSource === "favorites" && recipees.length > 0 && query.trim().length > 0) {
    const searchLower = query.toLowerCase();
    recipees = recipees.filter((recipe) =>
      recipe?.dish_name?.toLowerCase()?.includes(searchLower)
    );
  }

  const hasError = Boolean(error) || (data && data?.status_code !== 200);
  const showInitialLoader = isLoading && !data;
  const isSearching =
    recipeSource === "browse" &&
    query.trim().length >= 3 &&
    (isLoading || isValidating) &&
    !isInitialLoad;

  function handleCreateCustomMeal() {
    onCreateCustomMeal?.();
    closeRef.current?.click();
  }

  const searchHeader = (
    <MealSearchHeader
      searchInputRef={searchInputRef}
      query={query}
      onQueryChange={setQuery}
      recipeSource={recipeSource}
      onSourceChange={handleSourceChange}
    />
  );

  if (recipees.length === 0 && !isSearching && !showInitialLoader && !hasError) {
    return (
      <div className="p-4">
        {searchHeader}
        <EmptyState
          query={query}
          recipeSource={recipeSource}
          onClearSearch={() => setQuery("")}
          onSourceChange={handleSourceChange}
          onCreateCustomMeal={onCreateCustomMeal ? handleCreateCustomMeal : undefined}
          mealPlanAddFlow={Boolean(onCreateCustomMeal)}
          onOpenCreateRecipe={onOpenCreateRecipe}
        />
        <DialogClose ref={closeRef} />
      </div>
    );
  }

  return (
    <div className="p-4">
      {searchHeader}
    {showInitialLoader && !isSearching && <ContentLoader />}
    {isSearching && <SearchLoadingTip />}
    {hasError && !showInitialLoader && !isSearching && (
      <EmptyState
        query={query}
        recipeSource={recipeSource}
        onClearSearch={() => setQuery("")}
        onSourceChange={handleSourceChange}
        error={error || data?.message}
        onCreateCustomMeal={onCreateCustomMeal ? handleCreateCustomMeal : undefined}
        mealPlanAddFlow={Boolean(onCreateCustomMeal)}
        onOpenCreateRecipe={onOpenCreateRecipe}
      />
    )}
    {!hasError && !showInitialLoader && !isSearching && <>
      <div className="mb-4 flex flex-col items-start md:flex-row md:items-center justify-between gap-2 md:gap-4">
        {showPopularLabel ? (
          <p className="text-black/70 text-sm font-semibold">Most Searched Meals</p>
        ) : recipeSource === "my" ? (
          <p className="text-black/70 text-sm font-semibold">My Recipes</p>
        ) : recipeSource === "favorites" ? (
          <p className="text-black/70 text-sm font-semibold">Favorite Recipes</p>
        ) : (
          <p className="text-black/70 text-sm">Search results</p>
        )}
        {!onCreateCustomMeal && onOpenCreateRecipe ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onOpenCreateRecipe}
          >
            Add recipe
          </Button>
        ) : null}
      </div>
      <div className="max-h-[55vh] mb-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipees.map((recipe, index) => <RecipeDeatils
          key={index}
          recipe={recipe}
          selected={selected}
          setSelected={setSelected}
          onToggleFavorite={handleToggleFavorite}
        />)}
      </div>
      {selected && <Button
        onClick={() => {
          const servingState = applyDefaultServingNutrition(selected);
          onMealSelected?.({
            ...selected,
            ...servingState,
            per_100g: selected.per_100g || buildPer100gSnapshot(selected),
          });
          closeRef.current?.click();
        }}
        variant="wz"
        className="w-full"
      >
        {continueLabel}
      </Button>}
      <AddMealFooterAction
        recipeSource={recipeSource}
        onCreateCustomMeal={onCreateCustomMeal ? handleCreateCustomMeal : undefined}
        onOpenCreateRecipe={onOpenCreateRecipe}
        className="mt-3"
      />
    </>}
    <DialogClose ref={closeRef} />
  </div>
  );
}

function MealSearchHeader({ searchInputRef, query, onQueryChange, recipeSource, onSourceChange }) {
  return (
    <div className="space-y-3 pb-3">
      <Input
        ref={searchInputRef}
        autoFocus
        placeholder={
          recipeSource === "browse"
            ? "Search meals (min 3 characters)"
            : recipeSource === "my"
              ? "Filter my recipes"
              : "Filter favorites"
        }
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {RECIPE_SOURCE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSourceChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              recipeSource === value
                ? "border-[var(--accent-1)] bg-[var(--comp-2)] text-[var(--accent-1)]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddMealFooterAction({
  recipeSource,
  onCreateCustomMeal,
  onOpenCreateRecipe,
  className,
}) {
  if (recipeSource === "my" && onOpenCreateRecipe) {
    return (
      <CreateRecipeLink onClick={onOpenCreateRecipe} className={className} />
    );
  }
  if (onCreateCustomMeal) {
    return <CreateCustomMealLink onClick={onCreateCustomMeal} className={className} />;
  }
  if (onOpenCreateRecipe) {
    return (
      <div className={cn("flex justify-center", className)}>
        <Button type="button" variant="wz" size="sm" onClick={onOpenCreateRecipe}>
          Add recipe
        </Button>
      </div>
    );
  }
  return null;
}

function CreateRecipeLink({ onClick, className, children = "Create your recipe" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-center text-sm text-[var(--accent-1)] underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}

function CreateCustomMealLink({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-center text-sm text-[var(--accent-1)] underline-offset-4 hover:underline",
        className,
      )}
    >
      Create your own meal instead
    </button>
  );
}

function RecipeDeatils({
  recipe,
  selected,
  setSelected,
  onToggleFavorite
}) {
  return <div
    className={cn(
      "w-full flex flex-col cursor-pointer border-1 rounded-[10px] py-2 px-4 relative",
      isSameRecipe(selected, recipe) && "border-[var(--accent-1)] shadow-lg bg-[var(--comp-2)]"
    )}
    onClick={() => !isSameRecipe(selected, recipe) ? setSelected(recipe) : setSelected()}
  >
    <h3>{recipe.dish_name || recipe.title}</h3>

    <Button
      className="absolute top-0.5 right-1"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite?.(recipe);
      }}
    >
      {recipe.isFavorite ? (
        <Star className="text-yellow-400 fill-yellow-400 text-2xl" />
      ) : (
        <Star className="text-gray-400 text-2xl" />
      )}
    </Button>

    {typeof recipe.calories === "object"
      ? <RecipeCalories recipe={recipe} />
      : <DishCalories recipe={recipe} />}
  </div>
}

function DishCalories({ recipe }) {
  const nutrition = getServingNutrition(recipe);
  const servingLabel = recipe?.serving_size || formatServingSizeLabel(recipe);

  return <div className="text-xs text-black/70 mt-auto pt-2 flex flex-wrap gap-x-6 gap-y-1">
    <div className="flex items-center gap-1 w-full basis-full">
      <span className="text-black/50">Serving —</span>
      <span className="text-black/40 font-bold">{servingLabel}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Calories - <span className="text-black/40 font-bold">{nutrition.calories}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Protein - <span className="text-black/40 font-bold">{nutrition.protein}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Fats - <span className="text-black/40 font-bold">{nutrition.fats}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Carbs - <span className="text-black/40 font-bold">{nutrition.carbohydrates}</span>
    </div>
  </div>
}

function RecipeCalories({ recipe }) {
  const nutrition = getServingNutrition(recipe);

  return <div className="text-xs text-black/70 mt-auto pt-2 flex flex-wrap gap-x-6 gap-y-1">
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Calories - <span className="text-black/40 font-bold">{nutrition.calories}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Protein - <span className="text-black/40 font-bold">{nutrition.protein}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Fats - <span className="text-black/40 font-bold">{nutrition.fats}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Carbs - <span className="text-black/40 font-bold">{nutrition.carbohydrates}</span>
    </div>
  </div>
}

const isSameRecipe = (selected, currrent) => selected?._id === currrent?._id ||
  (selected?._id?.$oid === currrent?._id?.$oid && Boolean(selected?._id?.$oid))

function EmptyState({
  query,
  recipeSource,
  onClearSearch,
  onSourceChange,
  error,
  onCreateCustomMeal,
  mealPlanAddFlow,
  onOpenCreateRecipe,
}) {
  const hasSearchQuery = query && query.trim().length >= 3;

  return (
    <div className="min-h-[300px] flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        <div className="w-16 h-16 bg-[var(--comp-2)] rounded-full flex items-center justify-center mb-2">
          <Search className="w-8 h-8 text-black/40" />
        </div>
        {hasSearchQuery ? (
          <>
            <h3 className="text-lg font-semibold text-black/80">No recipes found</h3>
            <p className="text-sm text-black/60">
              We couldn't find any recipes matching <span className="font-semibold">"{query}"</span>
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-black/50">Try:</p>
              <ul className="text-xs text-black/60 space-y-1">
                <li>• Check your spelling</li>
                <li>• Use different keywords</li>
                <li>• Try a more general search term</li>
              </ul>
            </div>
            <div className="flex flex-col items-center gap-3 mt-6">
              <Button variant="outline" onClick={onClearSearch} className="text-sm">
                Clear Search
              </Button>
              <AddMealFooterAction
                recipeSource={recipeSource}
                onCreateCustomMeal={mealPlanAddFlow ? onCreateCustomMeal : undefined}
                onOpenCreateRecipe={onOpenCreateRecipe}
              />
            </div>
          </>
        ) : recipeSource === "my" ? (
          <>
            <h3 className="text-lg font-semibold text-black/80">No recipes yet</h3>
            <p className="text-sm text-black/60">
              You haven't added any recipes yet. Start by creating your first recipe!
            </p>
            <div className="mt-4">
              <AddMealFooterAction
                recipeSource={recipeSource}
                onCreateCustomMeal={mealPlanAddFlow ? onCreateCustomMeal : undefined}
                onOpenCreateRecipe={onOpenCreateRecipe}
              />
            </div>
          </>
        ) : recipeSource === "favorites" ? (
          <>
            <h3 className="text-lg font-semibold text-black/80">No favorites yet</h3>
            <p className="text-sm text-black/60">
              Star recipes while browsing to save them here for quick access.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => onSourceChange?.("browse")} className="text-sm">
                Browse meals
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-black/80">No recipes found</h3>
            <p className="text-sm text-black/60">
              {error || "Start searching for recipes or create your own custom meal"}
            </p>
            <div className="mt-4">
              <AddMealFooterAction
                recipeSource={recipeSource}
                onCreateCustomMeal={mealPlanAddFlow ? onCreateCustomMeal : undefined}
                onOpenCreateRecipe={onOpenCreateRecipe}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SearchLoadingTip() {
  return (
    <div className="mb-4 min-h-[200px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader />
        <div>
          <p className="text-sm font-semibold text-black/80">Searching through our database...</p>
          <p className="text-xs text-black/60 mt-1">
            This may take a moment as we search through thousands of recipes
          </p>
        </div>
      </div>
    </div>
  );
}