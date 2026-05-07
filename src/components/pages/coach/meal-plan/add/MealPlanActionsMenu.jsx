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
import CopyMealPlanDays from "./CopyMealPlanDays";
import CopyMealPlanModal from "./CopyMealPlanModal";
import MealTypeBulkDelete from "./MealTypeBulkDelete";
import RearrangeMealTypesDialog from "./RearrangeMealTypesDialog";
import SetMealTimingsDialog from "./SetMealTimingsDialog";

export default function MealPlanActionsMenu({
  toPlan,
  selectedPlan,
  showStartFromToday = false,
  showRearrangeMealTypes = false,
  onStartFromToday,
  onDefaultMealTimings,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyMealsOpen, setCopyMealsOpen] = useState(false);
  const [copyRecipesOpen, setCopyRecipesOpen] = useState(false);
  const [setMealTimingsOpen, setSetMealTimingsOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rearrangeOpen, setRearrangeOpen] = useState(false);

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

  const handleDefaultMealTimings = (event) => {
    event?.preventDefault?.();
    setMenuOpen(false);
    setSetMealTimingsOpen(true);
    if (typeof onDefaultMealTimings === "function") {
      onDefaultMealTimings();
    }
  };

  const handleBulkDeleteOpen = (event) => {
    event?.preventDefault?.();
    setBulkDeleteOpen(true)
    setMenuOpen(false);
  }

  const handleRearrangeOpen = (event) => {
    event?.preventDefault?.();
    setMenuOpen(false);
    setRearrangeOpen(true);
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
            onSelect={handleDefaultMealTimings}
          >
            Set Meal Timings
          </DropdownMenuItem>
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
          <DropdownMenuItem
            className="text-sm font-medium text-muted-foreground focus:text-foreground"
            onSelect={handleBulkDeleteOpen}
          >
            Meal Type Bulk Delete
          </DropdownMenuItem>
          {showRearrangeMealTypes && (
            <DropdownMenuItem
              className="text-sm font-medium text-muted-foreground focus:text-foreground"
              onSelect={handleRearrangeOpen}
            >
              Rearrange Meal Types
            </DropdownMenuItem>
          )}
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
      <SetMealTimingsDialog
        trigger={false}
        open={setMealTimingsOpen}
        onOpenChange={setSetMealTimingsOpen}
        />
      <MealTypeBulkDelete
        trigger={false}
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
      />
      <RearrangeMealTypesDialog
        trigger={false}
        selectedPlan={selectedPlan || toPlan}
        open={rearrangeOpen}
        onOpenChange={setRearrangeOpen}
      />
    </>
  );
}

