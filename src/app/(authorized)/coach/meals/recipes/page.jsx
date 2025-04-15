import FormControl from "@/components/FormControl";
import MealDisplayCard from "@/components/pages/coach/meals/MealDisplayCard";
import { Button } from "@/components/ui/button";
import { FolderInput, FolderOutput, Forward } from "lucide-react";

export default function Page() {
  return <div className="mt-8">
    <Header />
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 10 }, (_, i) => i).map(item => <MealDisplayCard key={item} />)}
    </div>
  </div>
}

function Header() {
  return <div className="mb-4 pb-4 flex items-center gap-4 border-b-1">
    <h4>Recipes</h4>
    <FormControl
      className="lg:min-w-[280px] [&_.input]:focus:shadow-2xl [&_.input]:bg-[var(--comp-1)] text-[12px] ml-auto"
      placeholder="Search Recipe.."
    />
    <Button size="sm" variant="wz">
      Add New Recipe
    </Button>
  </div>
}