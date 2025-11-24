import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { exportRecipe, reorderMealTypes, saveRecipe, selectMealPlanType } from "@/config/state-reducers/custom-meal";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Minus, Move, Pen, PlusCircle } from "lucide-react";
import { useState } from "react";
import EditSelectedMealDetails from "./EditSelectedMealDetails";
import SaveMealType from "./SaveMealType";

export default function SelectMeals() {
  const {
    dispatch,
    selectedPlans,
    selectedMealType,
    selectedPlan
  } = useCurrentStateContext();

  const [activeId, setActiveId] = useState(null);

  const rawPlan = selectedPlans[selectedPlan];
  console.log(selectedPlans)
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
  const selectedMealTypeRecipee = isArray
    ? plan.find(m => m.mealType === selectedMealType)?.meals || []
    : normalizedMeals.find(m => m.mealType === selectedMealType)?.meals || [];
  const errorMessage = !mealTypes ?
    "Please select a date"
    : mealTypes?.length === 0 && "Please select a Type!"

   const currentMeals = isArray ? plan : normalizedMeals || [];
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
        <SortableContext items={mealTypes || []}>
          {currentMeals.map((mealEntry, index) => (
            <SortableMealType
              key={mealEntry.mealType}
              index={index}
              type={mealEntry.mealType}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeId && activeMeal ? (
            <MealTypeButton type={activeMeal.mealType} isSelected={activeMeal.mealType === selectedMealType} />
          ) : null}
        </DragOverlay>
      </DndContext>
      <SaveMealType type="new" />
    </div>
    <div>
      {selectedMealTypeRecipee.map((recipe, index) => <div key={index} className="flex items-center gap-4">
        <EditSelectedMealDetails
          key={`${recipe?._id}-${recipe.time}` || `${index}-${recipe.time}`}
          index={index}
          recipe={recipe}
          defaultOpen={recipe.isNew || false}
        />
        <Minus
          className="bg-[var(--accent-2)] text-white cursor-pointer ml-auto rounded-full px-[2px]"
          strokeWidth={3}
          onClick={() => dispatch(exportRecipe(index))}
        />
      </div>)}
    </div>
    <Button
      onClick={() => dispatch(saveRecipe({}, undefined, true))}
      className="bg-transparent hover:bg-transparent w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]"
    >
      <PlusCircle className="min-w-[32px] min-h-[32px] text-[var(--accent-1)]" />
    </Button>
  </div>
}

function SortableMealType({ type, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: type,
  });

  const { dispatch, selectedMealType } = useCurrentStateContext()

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
          onClick={() => dispatch(selectMealPlanType(type))}
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