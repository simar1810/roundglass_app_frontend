import { Button } from "@/components/ui/button";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import SaveMealType from "./SaveMealType";
import { DialogTrigger } from "@/components/ui/dialog";
import { Minus, Pen, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportRecipe, saveRecipe, selectMealPlanType } from "@/config/state-reducers/custom-meal";
import EditSelectedMealDetails from "./EditSelectedMealDetails";

export default function SelectMeals() {
  const {
    dispatch,
    selectedPlans,
    selectedMealType,
    selectedPlan
  } = useCurrentStateContext();

  const mealTypes = selectedPlans[selectedPlan]?.map(meal => meal.mealType)
  const selectedMealTypeRecipee = selectedPlans[selectedPlan]?.find(mealType => mealType.mealType === selectedMealType)?.meals || []

  return <div>
    <div className="pt-4 flex gap-4 overflow-x-auto no-scrollbar">
      {mealTypes?.map((type, index) => <div key={index} className="relative">
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
      </div>)}
      <SaveMealType type="new" />
    </div>
    <div>
      {selectedMealTypeRecipee.map((recipe, index) => <div key={index} className="flex items-start gap-4">
        <EditSelectedMealDetails
          key={recipe?._id}
          index={index}
          recipe={recipe}
          defaultOpen={recipe.isNew}
        />
        <Minus
          className="cursor-pointer ml-auto"
          onClick={() => dispatch(exportRecipe(index))}
        />
      </div>)}
    </div>
    <Button
      onClick={() => dispatch(saveRecipe({}))}
      className="bg-transparent hover:bg-transparent w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]"
    >
      <PlusCircle className="min-w-[32px] min-h-[32px] text-[var(--accent-1)]" />
    </Button>
  </div>
}