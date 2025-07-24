import EditSelectedMealDetails from "./EditSelectedMealDetails"
import { CookingPot, Minus, MinusCircle } from "lucide-react"
import useCurrentStateContext from "@/providers/CurrentStateContext"
import { exportRecipe } from "@/config/state-reducers/custom-meal"
import { DialogTrigger } from "@/components/ui/dialog"

export default function SelectedMealDetails({
  recipe,
  index
}) {
  const { dispatch } = useCurrentStateContext();
  return <div className="flex items-start gap-4">
    <EditSelectedMealDetails
      key={recipe?._id}
      index={index}
      recipe={recipe}
    />
    <Minus
      className="cursor-pointer ml-auto"
      onClick={() => dispatch(exportRecipe(index))}
    />
  </div>
  if (!isPlanSelected(recipe)) return <div className="flex items-center gap-4">
    <EditSelectedMealDetails
      recipe={recipe}
      index={index}
    >
      <DialogTrigger className="w-full text-[var(--accent-1)] h-[120px] border-1 mt-2 rounded-md flex items-center justify-center gap-2 font-bold">
        <CookingPot /> Select Plan
      </DialogTrigger>
    </EditSelectedMealDetails>
    <MinusCircle
      className="text-[var(--accent-2)] cursor-pointer"
      onClick={() => dispatch(exportRecipe(index))}
    />
  </div>

}

function isPlanSelected(recipe) {
  return true
  return Boolean(recipe?._id?.$oid) || Boolean(recipe?._id) || Boolean(recipe?.mealId)
}