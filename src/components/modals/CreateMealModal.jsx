"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "@/components/FormControl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import useSWR from "swr";
import Loader from "../common/Loader";
import ContentError from "../common/ContentError";
import { getRecipes } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { addNewRecipe } from "@/config/state-reducers/add-meal-plan";
import { useRef } from "react";

export default function CreateMealModal() {
  return (
    <Dialog>
      <DialogTrigger>
        <div className="min-w-80 flex flex-col items-center justify-center">
          <div className="bg-[var(--comp-3)]/40 rounded-full mb-4 p-4 cursor-pointer">
            <Plus />
          </div>
          <h3>Add More recipes</h3>
        </div>
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] max-h-[70vh] overflow-y-auto gap-0 border-0 p-0">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold">
            Create Meal
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-4 pb-6 space-y-6">
          <div>
            <FormControl
              placeholder="Search Meals"
              className="w-full [&_.input]:bg-[var(--comp-1)] rounded-lg"
            />
          </div>
          <div>
            <h3 className="font-medium mb-4">Select from our Meal Library</h3>
            <RecipeesList />
          </div>
          <Button variant="wz" className="block mt-10 mx-auto">
            Add your own Recipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ListRecipeCard({ recipe }) {
  const { dispatch } = useCurrentStateContext();
  const closeBtnRef = useRef();

  function triggerAddRecipe() {
    dispatch(addNewRecipe(recipe))
    // closeBtnRef.current.click();
  }

  return <div
    onClick={triggerAddRecipe}
    className="py-4 flex items-center gap-3 cursor-pointer"
  >
    <Avatar>
      <AvatarImage src={recipe.image || "/not-found.pn"} />
      <AvatarFallback>{nameInitials(recipe.title)}</AvatarFallback>
    </Avatar>
    <span className="flex-1">{recipe.title}</span>
    <DialogClose ref={closeBtnRef} />
  </div>
}

function RecipeesList() {
  const { isLoading, error, data } = useSWR("getRecipes", getRecipes);

  if (isLoading) return <div className="w-full flex items-cener justify-center">
    <Loader />
  </div>

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const recipes = data.data;
  return <div className="grid grid-cols-2 gap-x-4 divide-y-1">
    {recipes.map((recipe, index) => <ListRecipeCard
      key={index}
      recipe={recipe}
    />)}
  </div>
}