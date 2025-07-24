import EditSelectedMealDetails from "./EditSelectedMealDetails"
import { Minus } from "lucide-react"
import useCurrentStateContext from "@/providers/CurrentStateContext"
import { exportRecipe } from "@/config/state-reducers/custom-meal"

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
}