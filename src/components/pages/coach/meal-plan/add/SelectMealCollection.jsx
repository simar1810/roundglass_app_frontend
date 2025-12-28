import ContentLoader from "@/components/common/ContentLoader";
import Loader from "@/components/common/Loader";
import RecipeModal from "@/components/modals/RecipeModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveRecipe } from "@/config/state-reducers/custom-meal";
import useDebounce from "@/hooks/useDebounce";
import { fetchData } from "@/lib/api";
import { getRecipes } from "@/lib/fetchers/app";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Flame, PlusCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

export default function SelectMealCollection({ children, index }) {
  return <Dialog>
    {children}
    {!Boolean(children) && <DialogTrigger className="w-full mt-4">
      <h3 className="text-left">Select Meals</h3>
      <div className="w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]">
        <PlusCircle size={32} className="text-[var(--accent-1)]" />
      </div>
    </DialogTrigger>}
    <DialogContent className="w-full md:min-w-[850px] p-0 gap-0">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Add Meals</DialogTitle>
      </DialogHeader>
      <RecipeesContainer index={index} />
    </DialogContent>
  </Dialog>
}

function getMealsEndpoint(query, showMyMeals, isInitialLoad) {
  // When toggle is ON (showMyMeals = true), fetch all coach recipes
  if (showMyMeals) {
    return getRecipes();
  }
  // When toggle is OFF, search recipes with query
  // If it's initial load and query is empty, fetch most searched recipes
  if (isInitialLoad && (!query || query.trim().length === 0)) {
    // Fetch most searched recipes to show when modal first opens
    return fetchData(`app/mostSearchedRecipes?person=coach`);
  }
  // When user is searching, require at least 3 characters
  if (query.length < 3) {
    return null; // Don't fetch if query is too short (unless it's initial load)
  }
  return fetchData(`app/recipees?query=${query}`);
}

function RecipeesContainer({ index }) {
  const [query, setQuery] = useState("");
  const [showMyMeals, setShowMyMeals] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const debouncedSearchQuery = useDebounce(query, 1000);
  
  // When showMyMeals is true, use a static key to fetch all coach recipes
  // When false, use query-based key for searching
  // Track if it's initial load (empty query) to show popular meals
  const isQueryEmpty = !query || query.trim().length === 0;
  const endpoint = showMyMeals
    ? `coach-recipes`
    : isQueryEmpty && isInitialLoad
    ? `popular-meals`
    : `recipees/${debouncedSearchQuery}`
  
  const { isLoading, isValidating, error, data } = useSWR(
    endpoint,
    () => getMealsEndpoint(debouncedSearchQuery, showMyMeals, isInitialLoad && isQueryEmpty)
  );
  
  const [selected, setSelected] = useState();
  const closeRef = useRef();
  const searchInputRef = useRef(null);
  const { dispatch } = useCurrentStateContext();
  
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Track when user starts typing to switch from popular meals to search
  // Also reset to popular meals when query is cleared
  useEffect(() => {
    if (query.trim().length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    } else if (query.trim().length === 0 && !isInitialLoad && !showMyMeals) {
      // When user clears the search, show popular meals again
      setIsInitialLoad(true);
    }
  }, [query, isInitialLoad, showMyMeals]);

  // Handle toggle change - clear query when turning ON to show all recipes
  const handleToggleChange = (value) => {
    setShowMyMeals(value);
    if (value) {
      // When toggle is turned ON, clear the query to show all coach recipes
      setQuery("");
      setIsInitialLoad(true);
    } else {
      // When toggle is turned OFF, reset to show popular meals
      setQuery("");
      setIsInitialLoad(true);
    }
  };

  // When showMyMeals is true, filter coach recipes client-side based on query
  // When false, use the data from API search
  let recipees = data?.data ?? [];
  let showPopularLabel = false;
  
  if (showMyMeals && recipees.length > 0) {
    // Filter coach recipes by search query (if query is empty, show all)
    if (query.trim().length > 0) {
      const searchLower = query.toLowerCase();
      recipees = recipees.filter(recipe => 
        recipe?.title?.toLowerCase()?.includes(searchLower) ||
        recipe?.dish_name?.toLowerCase()?.includes(searchLower)
      );
    }
  } else if (!showMyMeals && isQueryEmpty && isInitialLoad && recipees.length > 0) {
    // Show popular meals label when showing initial popular meals
    showPopularLabel = true;
  }
  
  const hasError = Boolean(error) || (data && data?.status_code !== 200);
  const showInitialLoader = isLoading && !data;
  // Show search loading when user is searching (query exists and is >= 3 chars) and data is being fetched
  const isSearching = !showMyMeals && query.trim().length >= 3 && (isLoading || isValidating) && !isInitialLoad;

  if (recipees.length === 0 && !isSearching && !showInitialLoader && !hasError) return <div className="p-4">
    <div className="flex items-center gap-4">
      <Input
        ref={searchInputRef}
        autoFocus
        placeholder="Enter Meal Plan"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ShowMyMealsToggle
        myMealsSelected={showMyMeals}
        onChange={handleToggleChange}
      />
    </div>
    <EmptyState 
      query={query}
      showMyMeals={showMyMeals}
      onClearSearch={() => setQuery("")}
    />
  </div>

  return <div className="p-4">
    <div className="flex items-center gap-4 pb-2">
      <Input
        ref={searchInputRef}
        autoFocus
        placeholder="Enter Meal Plan"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ShowMyMealsToggle
        myMealsSelected={showMyMeals}
        onChange={handleToggleChange}
      />
    </div>
    {showInitialLoader && !isSearching && <ContentLoader />}
    {isSearching && <SearchLoadingTip />}
    {hasError && !showInitialLoader && !isSearching && (
      <EmptyState 
        query={query}
        showMyMeals={showMyMeals}
        onClearSearch={() => setQuery("")}
        error={error || data?.message}
      />
    )}
    {!hasError && !showInitialLoader && !isSearching && <>
      <div className="mb-4 flex flex-col items-start md:flex-row md:items-center justify-between gap-2 md:gap-4">
        {showPopularLabel ? (
          <p className="text-black/70 text-sm font-semibold">Most Searched Meals</p>
        ) : (
          <p className="md:ml-auto text-black/70 text-sm font-bold">Can't find a Meal, Add your own</p>
        )}
        <RecipeModal type="new" />
      </div>
      <div className="max-h-[55vh] mb-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 no-scrollbar">
        {recipees.map((recipe, index) => <RecipeDeatils
          key={index}
          recipe={recipe}
          selected={selected}
          setSelected={setSelected}
        />)}
      </div>
      {selected && <Button
        onClick={() => {
          dispatch(saveRecipe(selected, index))
          closeRef.current.click()
        }}
        variant="wz"
        className="w-full"
      >
        Add
      </Button>}
    </>}
    <DialogClose ref={closeRef} />
  </div>
}

function RecipeDeatils({
  recipe,
  selected,
  setSelected
}) {
  return <div
    className={cn(
      "w-full flex flex-col cursor-pointer border-1 rounded-[10px] py-2 px-4",
      isSameRecipe(selected, recipe) && "border-[var(--accent-1)] shadow-lg bg-[var(--comp-2)]"
    )}
    onClick={() => !isSameRecipe(selected, recipe) ? setSelected(recipe) : setSelected()}
  >
    <h3>{recipe.dish_name || recipe.title}</h3>
    {typeof recipe.calories === "object"
      ? <RecipeCalories recipe={recipe} />
      : <DishCalories recipe={recipe} />}
  </div>
}

function DishCalories({ recipe }) {
  return <div className="text-xs text-black/70 mt-auto pt-2 flex flex-wrap gap-x-6 gap-y-1">
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Calories - <span className="text-black/40 font-bold">{recipe.calories}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Protein - <span className="text-black/40 font-bold">{recipe.protein}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Fats - <span className="text-black/40 font-bold">{recipe.fats}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Carbs - <span className="text-black/40 font-bold">{recipe.carbohydrates}</span>
    </div>
  </div>
}

function RecipeCalories({ recipe }) {
  return <div className="text-xs text-black/70 mt-auto pt-2 flex flex-wrap gap-x-6 gap-y-1">
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Calories - <span className="text-black/40 font-bold">{recipe?.calories?.total}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Protein - <span className="text-black/40 font-bold">{recipe?.calories.proteins}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Fats - <span className="text-black/40 font-bold">{recipe?.calories.fats}</span>
    </div>
    <div className="flex items-center gap-1">
      <Flame className="w-[16px] h-[16px] text-[var(--accent-1)]" />
      Carbs - <span className="text-black/40 font-bold">{recipe?.calories.carbs}</span>
    </div>
  </div>
}

const isSameRecipe = (selected, currrent) => selected?._id === currrent?._id ||
  (selected?._id?.$oid === currrent?._id?.$oid && Boolean(selected?._id?.$oid))

function ShowMyMealsToggle({ myMealsSelected, onChange }) {
  return <div>
    <p className="mb-1 whitespace-nowrap font-bold text-sm text-[#808080]">My Recipes</p>
    <Switch
      checked={myMealsSelected}
      onCheckedChange={value => {

        onChange(value)
      }}
    />
  </div>
}

function SearchLoadingTip() {
  return <div className="mb-4 min-h-[200px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader />
      <div>
        <p className="text-sm font-semibold text-black/80">Searching through our database...</p>
        <p className="text-xs text-black/60 mt-1">This may take a moment as we search through thousands of recipes</p>
      </div>
    </div>
  </div>
}

function EmptyState({ query, showMyMeals, onClearSearch, error }) {
  const hasSearchQuery = query && query.trim().length >= 3;
  
  return <div className="min-h-[300px] flex items-center justify-center py-8">
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
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClearSearch}
              className="text-sm"
            >
              Clear Search
            </Button>
            <RecipeModal type="new" />
          </div>
        </>
      ) : showMyMeals ? (
        <>
          <h3 className="text-lg font-semibold text-black/80">No recipes found</h3>
          <p className="text-sm text-black/60">
            You haven't added any recipes yet. Start by creating your first recipe!
          </p>
          <div className="mt-4">
            <RecipeModal type="new" />
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-black/80">No recipes found</h3>
          <p className="text-sm text-black/60">
            {error || "Start searching for recipes or create your own custom recipe"}
          </p>
          <div className="mt-4">
            <RecipeModal type="new" />
          </div>
        </>
      )}
    </div>
  </div>
}