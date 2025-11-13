import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import CopyMealPlanModal from "./CopyMealPlanModal";
import CopyMealPlanDays from "./CopyMealPlanDays";

export default function MealPlanActionsMenu({
  toPlan,
  showStartFromToday = false,
  onStartFromToday,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyMealsOpen, setCopyMealsOpen] = useState(false);
  const [copyRecipesOpen, setCopyRecipesOpen] = useState(false);

  const handleStartFromToday = () => {
    if (typeof onStartFromToday === "function") {
      onStartFromToday();
    }
    setMenuOpen(false);
  };

  const handleCopyMealsOpen = (event) => {
    event?.preventDefault?.();
    setMenuOpen(false);
    setCopyMealsOpen(true);
  };

  const handleCopyRecipesOpen = (event) => {
    event?.preventDefault?.();
    setMenuOpen(false);
    setCopyRecipesOpen(true);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Meal plan actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1.5">
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {showStartFromToday && (
            <DropdownMenuItem
              className="text-sm font-medium text-muted-foreground focus:text-foreground"
              onSelect={handleStartFromToday}
            >
              Start From Today
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-sm font-medium text-muted-foreground focus:text-foreground"
            onSelect={handleCopyMealsOpen}
          >
            Copy Meals
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-sm font-medium text-muted-foreground focus:text-foreground"
            onSelect={handleCopyRecipesOpen}
          >
            Copy Recipes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CopyMealPlanModal
        to={toPlan}
        trigger={false}
        open={copyMealsOpen}
        onOpenChange={setCopyMealsOpen}
      />
      <CopyMealPlanDays
        trigger={false}
        open={copyRecipesOpen}
        onOpenChange={setCopyRecipesOpen}
      />
    </>
  );
}

