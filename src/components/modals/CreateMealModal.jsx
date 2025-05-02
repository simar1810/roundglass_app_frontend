"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "@/components/FormControl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export default function CreateMealModal() {
  return (
    <Dialog open={true}>
      <DialogTrigger />
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
            <div className="grid grid-cols-2 gap-x-4 divide-y-1">
              {Array.from({ length: 4 }, (_, i) => i).map(recipe => <ListRecipeCard
                key={recipe}
                recipe={recipe}
              />)}
            </div>
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
  return <div className="py-4 flex items-center gap-3">
    <Avatar>
      <AvatarImage src={"" || "/not-found.pn"} />
      <AvatarFallback>{"RE"}</AvatarFallback>
    </Avatar>
    <span className="flex-1">Recipe Name 1</span>
    <FormControl
      type="checkbox"
      name="recipe"
      value="recipe1"
      className="w-5 h-5"
    />
  </div>
}