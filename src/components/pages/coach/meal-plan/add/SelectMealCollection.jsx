import ContentLoader from "@/components/common/ContentLoader";
import Loader from "@/components/common/Loader";
import RecipeModal from "@/components/modals/RecipeModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveRecipe } from "@/config/state-reducers/custom-meal";
import useDebounce from "@/hooks/useDebounce";
import { getRecipes } from "@/lib/fetchers/app";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Flame, PlusCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SelectMealCollection({ children, selectedDay, selectedMealType, index }) {
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
      <RecipeesContainer selectedDay={selectedDay} selectedMealType={selectedMealType} index={index} />
    </DialogContent>
  </Dialog>
}

const SEARCH_LIMIT = 20;
const QUERY_CACHE_TTL_MS = 45 * 1000;
const queryCache = new Map();

function RecipeesContainer({ index, selectedDay, selectedMealType }) {
  const [query, setQuery] = useState("");
  const [showMyMeals, setShowMyMeals] = useState(false);
  const debouncedSearchQuery = useDebounce(query, 350);
  const [forceSearchVersion, setForceSearchVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [recipes, setRecipes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: SEARCH_LIMIT, total: 0, hasMore: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [coachRecipes, setCoachRecipes] = useState([]);
  const [isCoachRecipesLoading, setIsCoachRecipesLoading] = useState(false);
  const [selected, setSelected] = useState();
  const closeRef = useRef();
  const searchInputRef = useRef(null);
  const { dispatch } = useCurrentStateContext();

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setPagination({ page: 1, limit: SEARCH_LIMIT, total: 0, hasMore: false });
    setErrorMessage("");
  }, [debouncedSearchQuery, forceSearchVersion]);

  const handleToggleChange = (value) => {
    setShowMyMeals(value);
    setQuery("");
    setPage(1);
    setRecipes([]);
    setErrorMessage("");
  };

  useEffect(() => {
    if (!showMyMeals) return;
    let ignore = false;
    setIsCoachRecipesLoading(true);
    setErrorMessage("");
    getRecipes()
      .then((res) => {
        if (ignore) return;
        if (res?.status_code !== 200 || res?.success === false) {
          setCoachRecipes([]);
          setErrorMessage(res?.error || res?.message || "Failed to fetch recipes");
          return;
        }
        setCoachRecipes(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (ignore) return;
        setCoachRecipes([]);
        setErrorMessage(err?.message || "Failed to fetch recipes");
      })
      .finally(() => {
        if (!ignore) setIsCoachRecipesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [showMyMeals]);

  useEffect(() => {
    if (showMyMeals) return;

    const trimmedQuery = debouncedSearchQuery.trim();
    const canFetch = trimmedQuery.length >= 2 || forceSearchVersion > 0;
    if (!canFetch) {
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const isFirstPage = page === 1;
    const cacheKey = `${trimmedQuery}::${page}::${SEARCH_LIMIT}::high`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      const list = Array.isArray(cached.payload?.data) ? cached.payload.data : [];
      const nextPagination = cached.payload?.pagination || { page, limit: SEARCH_LIMIT, total: list.length, hasMore: false };
      setRecipes((prev) => (isFirstPage ? list : [...prev, ...list]));
      setPagination(nextPagination);
      setErrorMessage("");
      return;
    }

    const abortController = new AbortController();
    setErrorMessage("");
    if (isFirstPage) setIsLoading(true);
    else setIsLoadingMore(true);

    fetch(`/api/app/recipees?query=${encodeURIComponent(trimmedQuery)}&page=${page}&limit=${SEARCH_LIMIT}&priority=high`, {
      method: "GET",
      signal: abortController.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (payload?.status_code !== 200 || payload?.success === false) {
          throw new Error(payload?.error || payload?.message || "Failed to fetch recipes");
        }
        queryCache.set(cacheKey, { timestamp: Date.now(), payload });
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const nextPagination = payload?.pagination || { page, limit: SEARCH_LIMIT, total: list.length, hasMore: false };
        setRecipes((prev) => (isFirstPage ? list : [...prev, ...list]));
        setPagination(nextPagination);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setErrorMessage(err?.message || "Failed to fetch recipes");
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });

    return () => abortController.abort();
  }, [showMyMeals, debouncedSearchQuery, page, forceSearchVersion]);

  const handleExplicitSubmit = () => {
    if (!query.trim()) return;
    setForceSearchVersion((prev) => prev + 1);
    setPage(1);
    setRecipes([]);
    setErrorMessage("");
  };

  const displayRecipes = showMyMeals ? coachRecipes : recipes;
  const showInitialLoader = showMyMeals ? isCoachRecipesLoading : isLoading;
  const canRenderResults = showMyMeals || debouncedSearchQuery.trim().length >= 2 || forceSearchVersion > 0;
  const hasError = Boolean(errorMessage);

  if (displayRecipes.length === 0 && !showInitialLoader && !hasError) return <div className="p-4">
    <div className="flex items-center gap-4">
      <Input
        ref={searchInputRef}
        autoFocus
        placeholder="Enter Meal Plan"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleExplicitSubmit();
          }
        }}
      />
      <ShowMyMealsToggle
        myMealsSelected={showMyMeals}
        onChange={handleToggleChange}
      />
    </div>
    {!showMyMeals && !canRenderResults && (
      <p className="text-xs text-black/60 mt-3">Type at least 2 characters to search.</p>
    )}
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
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleExplicitSubmit();
          }
        }}
      />
      <ShowMyMealsToggle
        myMealsSelected={showMyMeals}
        onChange={handleToggleChange}
      />
    </div>
    {showInitialLoader && <ContentLoader />}
    {hasError && !showInitialLoader && (
      <EmptyState 
        query={query}
        showMyMeals={showMyMeals}
        onClearSearch={() => setQuery("")}
        error={errorMessage}
      />
    )}
    {!hasError && !showInitialLoader && <>
      <div className="mb-4 flex flex-col items-start md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <p className="md:ml-auto text-black/70 text-sm font-bold">Can't find a Meal, Add your own</p>
        <RecipeModal type="new" />
      </div>
      <div className="max-h-[55vh] mb-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayRecipes.map((recipe, index) => <RecipeDeatils
          key={index}
          recipe={recipe}
          selected={selected}
          setSelected={setSelected}
        />)}
      </div>
      {!showMyMeals && pagination?.hasMore && (
        <Button
          variant="outline"
          className="w-full mb-3"
          disabled={isLoadingMore}
          onClick={() => setPage((prev) => prev + 1)}
        >
          {isLoadingMore ? "Loading..." : "Load more"}
        </Button>
      )}
      {isLoadingMore && <SearchLoadingTip />}
      {selected && <Button
        onClick={() => {
          dispatch(saveRecipe(selected, index, false, selectedDay, selectedMealType))
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