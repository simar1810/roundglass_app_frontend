import { Button } from "@/components/ui/button";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import SaveMealType from "./SaveMealType";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Minus, Move, Pen, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportRecipe, saveRecipe, selectMealPlanType } from "@/config/state-reducers/custom-meal";
import EditSelectedMealDetails from "./EditSelectedMealDetails";
import { useEffect, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SelectMeals() {
  const {
    dispatch,
    selectedPlans,
    selectedMealType,
    selectedPlan
  } = useCurrentStateContext();

  const plan = selectedPlans[selectedPlan];
  const isArray = Array.isArray(plan);

  const mealTypes = isArray
    ? plan.map(m => m.mealType)
    : plan?.meals?.map(m => m.mealType);
  const desiredOrder = ["breakfast", "lunch", "snack", "dinner"];
  const sortedMealTypes = mealTypes
    ? [...mealTypes].sort(
      (a, b) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b)
    )
    : [];
  const selectedMealTypeRecipee = isArray
    ? plan.find(m => m.mealType === selectedMealType)?.meals || []
    : plan?.meals?.find(m => m.mealType === selectedMealType)?.meals || [];
  const errorMessage = !mealTypes ?
    "Please select a date"
    : mealTypes?.length === 0 && "Please select a Type!"

  function onSortMeals(...arg) { }

  return <div>
    <div className="pt-4 flex gap-4 overflow-x-auto pb-4">
      {(!sortedMealTypes || sortedMealTypes?.length === 0) && <div className="bg-[var(--comp-1)] border-1 p-2 rounded-[6px] grow text-center mr-auto"
      >
        {errorMessage}
      </div>}
      <DndContext onDragEnd={onSortMeals}>
        <SortableContext items={sortedMealTypes}>
          {sortedMealTypes?.map((type, index) => <SortableMealType
            key={index}
            index={index}
            type={type}
          />)}
        </SortableContext>
      </DndContext>
      <SaveMealType type="new" />
    </div>
    <div>
      {selectedMealTypeRecipee.map((recipe, index) => <div key={index} className="flex items-center gap-4">
        <EditSelectedMealDetails
          key={recipe?._id || index}
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div className="relative">
      <div style={style}>
        <div className="relative">
          <Move
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="w-[14px] h-[14px] absolute translate-y-[-50%] translate-x-[50%] top-0 right-0 cursor-pointer"
          />
          <Button
            variant={type === selectedMealType ? "wz" : "outline"}
            onClick={() => dispatch(selectMealPlanType(type))}
            className="pr-6 font-bold"
          >
            {type}
          </Button>
          <SaveMealType
            type="edit"
            index={index}
            defaulValue={type}
          >
            <DialogTrigger className="absolute top-1/2 translate-y-[-50%] right-[6px] cursor-pointer" asChild>
              <Pen className={cn("w-[14px] h-[14px]", type === selectedMealType ? "text-white" : "text-[var(--accent-1)]")} />
            </DialogTrigger>
          </SaveMealType>
        </div>
      </div>
    </div>
  );
}