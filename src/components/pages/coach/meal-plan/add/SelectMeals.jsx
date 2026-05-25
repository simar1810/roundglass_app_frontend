import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DialogTrigger } from "@/components/ui/dialog";
import { exportRecipe, reorderMealTypes, selectMealPlanType } from "@/config/state-reducers/custom-meal";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Minus, Move, Pen, PlusCircle, RefreshCw, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import EditSelectedMealDetails from "./EditSelectedMealDetails";
import RecipeModal from "@/components/modals/RecipeModal";
import SelectMealCollection from "./SelectMealCollection";
import SaveMealType from "./SaveMealType";
import { checkArray } from "@/lib/formatter";
import { getServingNutrition } from "@/lib/nutrition/per100g";

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

  // const [selectedMealType, setSelectMealPlanType] = useState(rawPlan?.at(0)?.mealType)
  const initialMealType = rawPlan?.at(0)?.mealType || null;
  const [selectedMealType, setSelectMealPlanType] = useState(initialMealType);

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
    { mealType: "breakfast", meals: plan.breakfast },
    { mealType: "lunch", meals: plan.lunch },
    { mealType: "dinner", meals: plan.dinner },
    { mealType: "snacks", meals: plan.snacks },
  ].filter(item => Array.isArray(item.meals) && item.meals.length > 0)
  const mealTypes = isArray
    ? plan.map(m => m.mealType)
    : normalizedMeals.map(m => m.mealType);
  const errorMessage = !mealTypes ?
    "Please select a date"
    : mealTypes?.length === 0 && "Please select a Type!"

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

  //  For Selecting next meal type when current meal type is removed\
  useEffect(() => {
     if (!currentMeals?.length) {
       setSelectMealPlanType(null);
       return;
     }

     const exists = currentMeals.some(
       (m) => m.mealType === selectedMealType
     );

     if (!exists) {
       setSelectMealPlanType(currentMeals[0].mealType);
     }
  }, [currentMeals, selectedMealType]);

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
  const [addMealSearchOpen, setAddMealSearchOpen] = useState(false);
  const [createRecipeOpen, setCreateRecipeOpen] = useState(false);
  const [pendingMealAction, setPendingMealAction] = useState(null);
  const [replacingRecipeIndex, setReplacingRecipeIndex] = useState(null);
  const mealSelectedRef = useRef(false);
  const isVertical = viewType === "vertical";
  const isReplacing = replacingRecipeIndex != null;

  function openCreateRecipeModal() {
    setAddMealSearchOpen(false);
    setCreateRecipeOpen(true);
  }

  function startReplace(recipeIndex) {
    setReplacingRecipeIndex(recipeIndex);
    setAddMealSearchOpen(true);
  }

  function handleMealSelected(recipe) {
    mealSelectedRef.current = true;
    setPendingMealAction({
      recipe,
      replaceIndex: replacingRecipeIndex,
    });
    setAddMealSearchOpen(false);
  }

  function openCustomMealForm() {
    setAddMealSearchOpen(false);
    setPendingMealAction({
      recipe: {},
      replaceIndex: replacingRecipeIndex,
    });
  }

  function clearPendingMealAction() {
    setPendingMealAction(null);
  }

  function endReplaceFlow() {
    setReplacingRecipeIndex(null);
    clearPendingMealAction();
  }

  function handleBackToMealSearch() {
    clearPendingMealAction();
    setAddMealSearchOpen(true);
  }

  function handleMealSearchOpenChange(nextOpen) {
    setAddMealSearchOpen(nextOpen);
    if (nextOpen) return;
    if (mealSelectedRef.current) {
      mealSelectedRef.current = false;
      return;
    }
    setReplacingRecipeIndex(null);
  }

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
          .map((recipe, recipeIndex) => <div key={recipeIndex} className="flex items-center gap-3 border-1 bg-slate-50 p-2 pt-0 rounded-[10px]">
            <EditSelectedMealDetails
              key={`${recipe?._id}-${recipe.time}` || `${recipeIndex}-${recipe.time}`}
              index={recipeIndex}
              recipe={recipe}
              selectedDay={selectedPlan}
              selectedMealType={meal.mealType}
              onReplaceRequest={() => startReplace(recipeIndex)}
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs font-medium"
                onClick={() => startReplace(recipeIndex)}
              >
                <RefreshCw size={14} className="mr-1" />
                Replace
              </Button>
              <button
                type="button"
                aria-label="Remove dish"
                className="rounded-full bg-[var(--accent-2)] p-0.5 text-white"
                onClick={() => dispatch(exportRecipe(recipeIndex, selectedPlan, meal.mealType))}
              >
                <Minus strokeWidth={3} size={18} />
              </button>
            </div>
        </div>)}
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
      <RecipeModal
        type="new"
        open={createRecipeOpen}
        onOpenChange={setCreateRecipeOpen}
      />
      <SelectMealCollection
        open={addMealSearchOpen}
        onOpenChange={handleMealSearchOpenChange}
        selectedDay={selectedPlan}
        selectedMealType={meal.mealType}
        dialogTitle={isReplacing ? "Replace meal" : "Add Meals"}
        continueLabel={isReplacing ? "Use this meal" : "Continue"}
        onMealSelected={handleMealSelected}
        onCreateCustomMeal={openCustomMealForm}
        onOpenCreateRecipe={openCreateRecipeModal}
      >
        <Button
          type="button"
          onClick={() => setAddMealSearchOpen(true)}
          className="bg-transparent hover:bg-transparent w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]"
          key={selectedPlan}
        >
          <PlusCircle className="min-w-[32px] min-h-[32px] text-[var(--accent-1)]" />
        </Button>
      </SelectMealCollection>
      {pendingMealAction && (
        <EditSelectedMealDetails
          draftMode
          recipe={pendingMealAction.recipe}
          replaceIndex={pendingMealAction.replaceIndex}
          selectedDay={selectedPlan}
          selectedMealType={meal.mealType}
          onDiscard={
            pendingMealAction.replaceIndex != null ? endReplaceFlow : clearPendingMealAction
          }
          onMealAddFlowComplete={
            pendingMealAction.replaceIndex != null ? endReplaceFlow : clearPendingMealAction
          }
          onBackToMealSearch={handleBackToMealSearch}
        />
      )}
    </CollapsibleContent>
  </Collapsible>
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
          const n = parseFloat(String(val).replace(/,/g, ""));
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      };

      return checkArray(mealsForSelectedType).reduce(
        (acc, meal) => {
          const nutrition = getServingNutrition(meal);
          acc.calories += parseNum(nutrition.calories);
          acc.protein += parseNum(nutrition.protein);
          acc.carbohydrates += parseNum(nutrition.carbohydrates);
          acc.fats += parseNum(nutrition.fats);
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