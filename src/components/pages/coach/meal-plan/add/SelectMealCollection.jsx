import ContentError from "@/components/common/ContentError";
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
import { getRecipesCalorieCounter } from "@/lib/fetchers/app";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Flame, PlusCircle } from "lucide-react";
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

function getMealsEndpoint(query, showMyMeals) {
  const endpoint = showMyMeals
    ? `app/dishes?query=${query}`
    : `app/recipees?query=${query}`
  if (query.length <= 3) {
    toast.error("At least enter 3 characters.");
    return;
  }
  return fetchData(endpoint);
}

function RecipeesContainer({ index }) {
  const [query, setQuery] = useState("rajma");
  const [showMyMeals, setShowMyMeals] = useState(false)
  const debouncedSearchQuery = useDebounce(query, 1000);
  const endpoint = showMyMeals
    ? `dishes/${debouncedSearchQuery}`
    : `recipees/${debouncedSearchQuery}`
  const { isLoading, isValidating, error, data } = useSWR(
    endpoint,
    () => getMealsEndpoint(debouncedSearchQuery, showMyMeals)
  );
  const [selected, setSelected] = useState();
  const closeRef = useRef();
  const searchInputRef = useRef(null);
  const { dispatch } = useCurrentStateContext();
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const recipees = data?.data ?? [];
  const hasError = Boolean(error) || (data && data?.status_code !== 200);
  const showInitialLoader = isLoading && !data;

  if (recipees.length === 0) return <div className="p-4">
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
        onChange={setShowMyMeals}
      />
    </div>
    <ContentError title="No recipes found!" />
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
        onChange={setShowMyMeals}
      />
      {(isLoading || isValidating) && <Loader />}
    </div>
    {showInitialLoader && <ContentLoader />}
    {hasError && !showInitialLoader && <ContentError title={error || data?.message || "No recipes found!"} />}
    {!hasError && !showInitialLoader && <>
      <div className="mb-4 flex flex-col items-start md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <p className="md:ml-auto text-black/70 text-sm font-bold">Can't find a Meal, Add your own</p>
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