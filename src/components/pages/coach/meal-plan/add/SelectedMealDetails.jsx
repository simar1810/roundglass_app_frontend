import { Badge } from "@/components/ui/badge"
import Image from "next/image"
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
  return <div className="mt-4 flex items-start gap-4">
    <Image
      alt=""
      src={recipe.image || "/not-found.png"}
      height={100}
      width={100}
      className="rounded-lg"
    />
    <div>
      <h3>{recipe.dish_name || recipe.title}</h3>
      <p>{recipe.meal_time}</p>
      <div className="mt-2 flex flex-wrap gap-1 overflow-x-auto no-scrollbar">
        {typeof recipe.calories === "object"
          ? <RecipeCalories recipe={recipe} />
          : <MealCalories recipe={recipe} />}
      </div>
    </div>
    <EditSelectedMealDetails
      key={recipe?._id?.$oid}
      index={index}
      recipe={recipe}
    />
    <Minus
      className="cursor-pointer"
      onClick={() => dispatch(exportRecipe(index))}
    />
  </div>
}

function isPlanSelected(recipe) {
  return Boolean(recipe?._id?.$oid) || Boolean(recipe?._id) || Boolean(recipe?.mealId)
}

function MealCalories({ recipe }) {
  return <>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Kcal -</span>{recipe?.calories}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Protien -</span> {recipe.protein}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Carbs -</span> {recipe.carbohydrates}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Fats -</span> {recipe.fats}</Badge>
  </>
}

function RecipeCalories({ recipe }) {
  return <>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Protien -</span> {recipe?.calories?.proteins}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Carbs -</span> {recipe?.calories?.carbs}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Fats -</span> {recipe?.calories?.fats}</Badge>
    <Badge className="bg-[#EFEFEF] text-black"><span className="text-black/40">Kcal -</span>{recipe?.calories?.total}</Badge>
  </>
}