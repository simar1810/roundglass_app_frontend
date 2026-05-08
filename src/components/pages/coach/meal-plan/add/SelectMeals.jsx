import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DialogTrigger } from "@/components/ui/dialog";
import { exportRecipe, reorderMealTypes, saveRecipe, selectMealPlanType } from "@/config/state-reducers/custom-meal";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Clock3, Info, Minus, Move, Pen, PlusCircle, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import EditSelectedMealDetails from "./EditSelectedMealDetails";
import SaveMealType from "./SaveMealType";
import { checkArray } from "@/lib/formatter";
import useDebounce from "@/hooks/useDebounce";

const INLINE_RECIPE_SEARCH_LIMIT = 10;
const INLINE_RECIPE_SEARCH_MIN_QUERY = 2;
const INLINE_RECIPE_CACHE_TTL_MS = 60 * 1000;
const inlineRecipeSearchCache = new Map();

export default function SelectMeals({
  selectedPlan,
  viewType
}) {
  const {
    dispatch,
    selectedPlans,
  } = useCurrentStateContext();

  const [activeId, setActiveId] = useState(null);
  const rawPlan = selectedPlans[selectedPlan];
  const [selectedMealType, setSelectMealPlanType] = useState(rawPlan?.at(0)?.mealType)

  const isWeekly = rawPlan &&
  typeof rawPlan === "object" &&
  !Array.isArray(rawPlan) &&
  Object.keys(rawPlan)?.some(day =>
    ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
      .includes(day.toLowerCase())
    );
  let plan;

  if (isWeekly) {
    const selectedDay = selectedMealType?.toLowerCase(); 
    plan = rawPlan[selectedDay] || {};
  } else {
    plan = rawPlan || {};
  }
  const isArray = Array.isArray(plan);

  const normalizedMeals =  [
    { mealType: "Breakfast", meals: Array.isArray(plan.breakfast) ? plan.breakfast : [] },
    { mealType: "Lunch", meals: Array.isArray(plan.lunch) ? plan.lunch : [] },
    { mealType: "Dinner", meals: Array.isArray(plan.dinner) ? plan.dinner : [] },
    { mealType: "Snacks", meals: Array.isArray(plan.snacks) ? plan.snacks : [] },
  ];
  const mealTypes = isArray
    ? plan.map(m => m.mealType)
    : normalizedMeals.map(m => m.mealType);
  const errorMessage = !mealTypes ? "Please select a date" : mealTypes?.length === 0 && "Please select a Type!"

   const currentMeals = checkArray(isArray ? plan : normalizedMeals || [])
  const activeMeal = activeId ? currentMeals.find(m => m.mealType === activeId) : null;

  function onSortMeals(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = currentMeals.findIndex(m => m.mealType === active.id);
    const newIndex = currentMeals.findIndex(m => m.mealType === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      dispatch(reorderMealTypes(oldIndex, newIndex));
    }
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  return <div>
    <div className="pt-4 flex gap-4 overflow-x-auto pb-4 items-center">
      {(!mealTypes || mealTypes?.length === 0) && <div className="bg-[var(--comp-1)] border-1 p-2 rounded-[6px] grow text-center mr-auto"
      >
        {errorMessage}
      </div>}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={onSortMeals}
      >
        {viewType === "horizontal" && <SortableContext items={mealTypes || []}>
          {currentMeals.map((mealEntry, index) => (
            <SortableMealType
              selectedMealType={selectedMealType}
              setSelectMealPlanType={setSelectMealPlanType}
              key={mealEntry.mealType}
              index={index}
              type={mealEntry.mealType}
              selectedPlan={selectedPlan}
            />
          ))}
        </SortableContext>}
        {viewType === "vertical" && <div></div>}
        <DragOverlay>
          {activeId && activeMeal ? (
            <MealTypeButton type={activeMeal.mealType} isSelected={activeMeal.mealType === selectedMealType} />
          ) : null}
        </DragOverlay>
      </DndContext>
      <SaveMealType type="new" selectedPlan={selectedPlan} />
    </div>
    {currentMeals
      .filter(({ mealType }) => (viewType === "vertical") || (mealType === selectedMealType))
      .map((meal, index) => <MealTypesListing
        key={meal.mealType}
        index={index}
        selectedPlan={selectedPlan}
        meal={meal}
        viewType={viewType}
        selectedMealType={selectedMealType}
      />)}
    <NutrientsBreakdown mealsForSelectedType={
      viewType === "horizontal"
        ? currentMeals
          .find(({ mealType }) => (mealType === selectedMealType))
          ?.meals
        : currentMeals
          .flatMap(item => item.meals)}
    />
  </div>
}

function MealTypesListing({
  index,
  selectedPlan,
  meal,
  viewType,
}) {
  const { dispatch } = useCurrentStateContext();
  const [open, setOpen] = useState(true);
  const isVertical = viewType === "vertical";

  return <Collapsible
    open={isVertical ? open : true}
    onOpenChange={isVertical ? setOpen : undefined}
    className="bg-white mb-4 py-4 px-4 border-1 rounded-[10px]"
  >
    <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
      <div className="flex items-center gap-2">
        {isVertical && (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label={`Toggle ${meal.mealType}`}
            >
              <ChevronDown
                size={14}
                className={cn("transition-transform duration-200", open && "rotate-180")}
              />
            </button>
          </CollapsibleTrigger>
        )}
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          {meal.mealType}
        </h3>
      </div>

      <div className="flex items-center gap-2">
        <SaveMealType
          type="edit"
          index={index}
          defaulValue={meal.mealType}
          selectedPlan={selectedPlan}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:text-slate-700"
            >
              <Pen size={14} className="mr-2 opacity-70" />
              Edit
            </Button>
          </DialogTrigger>
        </SaveMealType>
        <Button
          onClick={() => dispatch({
            type: "DELETE_MEAL_TYPE_RECIPES",
            payload: { selectedDay: selectedPlan, mealType: meal.mealType }
          })}
          variant="ghost"
          className="group h-8 px-3 text-xs font-medium text-red-500 bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 size={14} className="mr-2 opacity-70 group-hover:opacity-100" />
          Remove Dishes
        </Button>
      </div>
    </div>
    <CollapsibleContent>
      <div className={cn(viewType === "vertical" && "grid md:grid-cols-2 gap-4")}>
        {checkArray(meal.meals)
          .map((recipe, recipeIndex) => (
            <EditSelectedMealDetails
              key={`${recipe?._id || recipe?.id || recipeIndex}-${recipeIndex}`}
              index={recipeIndex}
              recipe={recipe}
              defaultOpen={false}
              selectedDay={selectedPlan}
              selectedMealType={meal.mealType}
            >
              <InlineMealCard
                recipe={recipe}
                recipeIndex={recipeIndex}
                selectedPlan={selectedPlan}
                selectedMealType={meal.mealType}
                onRemove={(e) => {
                  e?.stopPropagation?.();
                  dispatch(exportRecipe(recipeIndex, selectedPlan, meal.mealType));
                }}
              />
            </EditSelectedMealDetails>
          ))}
      </div>
      {checkArray(meal.meals).length === 0 && <div className="flex flex-col items-center justify-center min-h-40 p-8 rounded-xl border-1 border-dashed border-slate-200 bg-slate-50/50 transition-all">
        <div className="relative mb-3">
          <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-20" />
          <div className="relative bg-white p-3 rounded-full shadow-sm border border-slate-100">
            <UtensilsCrossed size={24} className="text-slate-400" />
          </div>
        </div>
        <div className="text-center">
          <h4 className="text-sm font-semibold text-slate-700">
            No meals added yet
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[180px] leading-relaxed">
            Select your preferred meals
          </p>
        </div>
      </div>}
      <InlineRecipeSearch
        selectedPlan={selectedPlan}
        mealType={meal.mealType}
      />
    </CollapsibleContent>
  </Collapsible>
}

function InlineMealCard({
  recipe,
  recipeIndex,
  selectedPlan,
  selectedMealType,
  onRemove,
}) {
  const { dispatch } = useCurrentStateContext();
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(recipe?.description || "");
  const [timeDraft, setTimeDraft] = useState(recipe?.time || "");
  const [quantityDraft, setQuantityDraft] = useState(recipe?.quantity || 1);
  const [measureDraft, setMeasureDraft] = useState(recipe?.selected_measure_name || recipe?.measure || "");

  useEffect(() => {
    setDescriptionDraft(recipe?.description || "");
    setTimeDraft(recipe?.time || "");
    setQuantityDraft(recipe?.quantity || 1);
    setMeasureDraft(recipe?.selected_measure_name || recipe?.measure || "");
  }, [recipe?.description, recipe?.time, recipe?.quantity, recipe?.selected_measure_name, recipe?.measure]);

  function saveInlinePatch(patch) {
    dispatch(saveRecipe(
      { ...recipe, ...patch },
      recipeIndex,
      false,
      selectedPlan,
      selectedMealType
    ));
  }

  function onTimeChange(value) {
    setTimeDraft(value);
    saveInlinePatch({ time: value, meal_time: value });
  }

  function onDescriptionSave() {
    saveInlinePatch({ description: descriptionDraft });
    setIsEditingDesc(false);
  }

  function onServingSave() {
    const quantity = Number(quantityDraft);
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    saveInlinePatch({
      quantity: safeQuantity,
      measure: measureDraft || "",
      selected_measure_name: measureDraft || "",
      serving_size: `${safeQuantity} ${measureDraft || "serving"}`,
    });
  }

  const calories = typeof recipe?.calories === "object" ? recipe?.calories?.total : recipe?.calories;
  const protein = recipe?.protein ?? recipe?.calories?.proteins;
  const carbs = recipe?.carbohydrates ?? recipe?.calories?.carbs;
  const fats = recipe?.fats ?? recipe?.calories?.fats;

  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAdditionalInfo((prev) => !prev);
          }}
          className="mt-1 inline-flex h-8 items-center gap-1 rounded-full border bg-white px-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
          aria-label="Toggle additional information"
        >
          <Info className="h-3.5 w-3.5" />
          More
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {recipe?.dish_name || recipe?.title || recipe?.name || "Untitled meal"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <MacroCircle label="Kcal" value={Number(calories || 0).toFixed(0)} className="border-blue-200 bg-blue-50 text-blue-700" />
            <MacroCircle label="P" value={`${Number(protein || 0).toFixed(1)}g`} className="border-emerald-200 bg-emerald-50 text-emerald-700" />
            <MacroCircle label="C" value={`${Number(carbs || 0).toFixed(1)}g`} className="border-rose-200 bg-rose-50 text-rose-700" />
            <MacroCircle label="F" value={`${Number(fats || 0).toFixed(1)}g`} className="border-amber-200 bg-amber-50 text-amber-700" />
          </div>
        </div>
        <button
          type="button"
          className="rounded-full bg-[var(--accent-2)] p-1 text-white hover:opacity-90"
          onClick={onRemove}
          aria-label="Remove meal"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[190px_1fr]">
        <label className="flex min-h-[44px] items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Clock3 className="h-4 w-4 text-slate-500" />
          <input
            type="time"
            className="w-full text-sm font-medium outline-none"
            value={timeDraft}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        </label>

        {!isEditingDesc ? (
          <button
            type="button"
            className="rounded-md border bg-white px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100"
            onClick={() => setIsEditingDesc(true)}
          >
            {descriptionDraft ? descriptionDraft : "Add description"}
          </button>
        ) : (
          <div className="rounded-md border bg-white p-2">
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              className="min-h-[60px] w-full resize-none text-xs outline-none"
              placeholder="Add description"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={onDescriptionSave}>
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          showAdditionalInfo ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="grid grid-cols-1 gap-2 rounded-md border bg-white p-2 sm:grid-cols-[120px_1fr_auto]">
          <input
            type="number"
            min={1}
            step={1}
            value={quantityDraft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setQuantityDraft(e.target.value)}
            className="h-9 rounded-md border px-2 text-sm"
            placeholder="Qty"
          />
          <input
            type="text"
            value={measureDraft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setMeasureDraft(e.target.value)}
            className="h-9 rounded-md border px-2 text-sm"
            placeholder="Measure / Serving size (e.g. bowl, cup)"
          />
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onServingSave();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function MacroCircle({ label, value, className }) {
  return (
    <div className={cn("flex h-12 min-w-12 flex-col items-center justify-center rounded-full border px-2", className)}>
      <span className="text-[9px] font-semibold uppercase leading-none opacity-80">{label}</span>
      <span className="text-[10px] font-bold leading-tight">{value}</span>
    </div>
  );
}

function InlineRecipeSearch({ selectedPlan, mealType }) {
  const { dispatch } = useCurrentStateContext();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < INLINE_RECIPE_SEARCH_MIN_QUERY) {
      setResults([]);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = inlineRecipeSearchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < INLINE_RECIPE_CACHE_TTL_MS) {
      setResults(cached.data);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setErrorMessage("");

    fetch(`/api/app/recipees?query=${encodeURIComponent(trimmed)}&page=1&limit=${INLINE_RECIPE_SEARCH_LIMIT}&priority=high`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const payload = await res.json();
        if (payload?.status_code !== 200 || payload?.success === false) {
          throw new Error(payload?.error || payload?.message || "Failed to search recipes");
        }
        const nextResults = Array.isArray(payload?.data) ? payload.data : [];
        inlineRecipeSearchCache.set(cacheKey, {
          timestamp: Date.now(),
          data: nextResults,
        });
        setResults(nextResults);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setResults([]);
        setErrorMessage(error?.message || "Failed to search recipes");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  function addRecipe(recipe) {
    dispatch(saveRecipe(recipe, undefined, false, selectedPlan, mealType));
    setShowResults(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function addCustomMealInline() {
    dispatch(saveRecipe({
      dish_name: "New custom meal",
      description: "",
      ingredients: "",
      method: "",
      calories: "",
      protein: "",
      carbohydrates: "",
      fats: "",
    }, undefined, true, selectedPlan, mealType));
    setShowResults(false);
  }

  function parseNum(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function getMacroSummary(recipe) {
    const calories = typeof recipe?.calories === "object" ? recipe?.calories?.total : recipe?.calories;
    const protein = recipe?.protein ?? recipe?.calories?.proteins;
    const carbs = recipe?.carbohydrates ?? recipe?.calories?.carbs;
    const fats = recipe?.fats ?? recipe?.calories?.fats;
    return {
      calories: parseNum(calories),
      protein: parseNum(protein),
      carbs: parseNum(carbs),
      fats: parseNum(fats),
    };
  }

  return (
    <div className="mt-4 rounded-lg border bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setShowResults(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          placeholder={`Search and add recipes to ${mealType}...`}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/30"
        />
        <Button
          onClick={addCustomMealInline}
          variant="outline"
          className="shrink-0"
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          Custom
        </Button>
      </div>

      {showResults && (
        <div className="mt-3 max-h-[320px] overflow-y-auto space-y-2">
          {query.trim().length < INLINE_RECIPE_SEARCH_MIN_QUERY && (
            <p className="text-xs text-slate-500">Type at least 2 characters to search recipes.</p>
          )}
          {loading && <p className="text-xs text-slate-500">Searching recipes...</p>}
          {!loading && errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
          {!loading && !errorMessage && query.trim().length >= INLINE_RECIPE_SEARCH_MIN_QUERY && results.length === 0 && (
            <p className="text-xs text-slate-500">No recipes found. Try another keyword.</p>
          )}
          {!loading && !errorMessage && results.map((recipe, index) => (
            <button
              key={`${recipe?._id || recipe?.id || recipe?.dish_name || "recipe"}-${index}`}
              type="button"
              onClick={() => addRecipe(recipe)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  addRecipe(recipe);
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/30"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{recipe?.dish_name || recipe?.title || "Untitled recipe"}</p>
                {(() => {
                  const macro = getMacroSummary(recipe);
                  return (
                    <div className="mt-1 flex flex-wrap gap-2">
                      <MacroCircle label="Kcal" value={macro.calories.toFixed(0)} className="border-blue-200 bg-blue-50 text-blue-700" />
                      <MacroCircle label="P" value={`${macro.protein.toFixed(1)}g`} className="border-emerald-200 bg-emerald-50 text-emerald-700" />
                      <MacroCircle label="C" value={`${macro.carbs.toFixed(1)}g`} className="border-rose-200 bg-rose-50 text-rose-700" />
                      <MacroCircle label="F" value={`${macro.fats.toFixed(1)}g`} className="border-amber-200 bg-amber-50 text-amber-700" />
                    </div>
                  );
                })()}
              </div>
              <span className="ml-auto text-xs font-semibold text-[var(--accent-1)]">Add</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableMealType({ selectedPlan, selectedMealType, setSelectMealPlanType, type, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: type,
  });

  const { dispatch } = useCurrentStateContext()

  const isSelected = type === selectedMealType;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : (transition || "transform 200ms ease"),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      <div className="relative">
        <Button
          variant={isSelected ? "wz" : "outline"}
          onClick={() => setSelectMealPlanType(type)}
          className="pr-6 pl-8 font-bold whitespace-nowrap"
          disabled={isDragging}
        >
          {type}
        </Button>
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute left-[6px] top-1/2 translate-y-[-50%] flex items-center justify-center w-5 h-5 rounded cursor-grab active:cursor-grabbing",
            "hover:bg-black/10 dark:hover:bg-white/10",
            "transition-colors duration-150",
            "touch-none select-none z-10"
          )}
          title="Drag to reorder"
        >
          <Move
            className={cn(
              "w-3.5 h-3.5",
              isSelected ? "text-white/70" : "text-[var(--accent-1)]/70"
            )}
            strokeWidth={2}
          />
        </div>
        <SaveMealType
          type="edit"
          index={index}
          defaulValue={type}
          selectedPlan={selectedPlan}
        >
          <DialogTrigger className="absolute top-1/2 translate-y-[-50%] right-[6px] cursor-pointer z-10" asChild>
            <Pen className={cn("w-[14px] h-[14px]", isSelected ? "text-white" : "text-[var(--accent-1)]")} />
          </DialogTrigger>
        </SaveMealType>
      </div>
    </div>
  );
}

function MealTypeButton({ type, isSelected }) {
  return (
    <div className="relative">
      <Button
        variant={isSelected ? "wz" : "outline"}
        className="pr-6 pl-8 font-bold whitespace-nowrap shadow-xl opacity-95"
      >
        {type}
      </Button>
    </div>
  );
}

function NutrientsBreakdown({ mealsForSelectedType }) {
  const totals = useMemo(() => {
      const parseNum = (val) => {
        if (typeof val === "number") return Number.isFinite(val) ? val : 0;
        if (typeof val === "string") {
          const n = parseFloat(val.replace(/,/g, ""));
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      };

      return checkArray(mealsForSelectedType).reduce(
        (acc, meal) => {
          const caloriesVal =
            typeof meal?.calories === "object"
              ? meal?.calories?.total
              : meal?.calories;
          const proteinVal = meal?.protein ?? meal?.calories?.proteins;
          const carbsVal = meal?.carbohydrates ?? meal?.calories?.carbs;
          const fatsVal = meal?.fats ?? meal?.calories?.fats;
  
          acc.calories += parseNum(caloriesVal);
          acc.protein += parseNum(proteinVal);
          acc.carbohydrates += parseNum(carbsVal);
          acc.fats += parseNum(fatsVal);
          return acc;
        },
        { calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
      );
    }, [mealsForSelectedType]);
  return <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-4">
    {[
      { label: 'Calories', value: totals.calories, unit: 'kcal', color: 'text-blue-600' },
      { label: 'Protein', value: totals.protein, unit: 'g', color: 'text-emerald-600' },
      { label: 'Fats', value: totals.fats, unit: 'g', color: 'text-amber-600' },
      { label: 'Carbs', value: totals.carbohydrates, unit: 'g', color: 'text-rose-600' }
    ].map((stat) => (
      <div key={stat.label} className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
          {stat.label}
        </span>
        <span className={`text-sm font-black ${stat.color}`}>
          {stat.value.toFixed(1)}
          <span className="ml-0.5 text-[10px] opacity-70">{stat.unit}</span>
        </span>
      </div>
    ))}
  </div>
}