
import { useEffect, useMemo, useRef } from "react";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useCopyMealPlan, { CopyMealPlansContext } from "@/providers/copy-meal-plan/CopyMealPlansProvider";
import {
  addCopySourceSlot,
  duplicateCopySlot,
  initCopyPayload,
  removeCopySlot,
  resetCopySelections,
  setCopySourcePlan,
  updateSlotDate,
  updateSlotMealType,
  updateSlotSourceMeal,
  updateSlotSourcePlan,
} from "@/providers/copy-meal-plan/reducer";
import { defaultMealTypes, replaceMealPlanSelections } from "@/config/state-reducers/custom-meal";
import { format, getDaysInMonth, parse } from "date-fns";

export default function CopyMealPlanDays() {
  const { selectedPlans, selectedPlan, mode } = useCurrentStateContext();
  const planKeys = Object.keys(selectedPlans ?? {});
  const safeSelectedPlan = selectedPlans?.[selectedPlan] ? selectedPlan : planKeys[0] ?? "";

  return <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="wz"
      >Copy Recipes</Button>
    </DialogTrigger>
    <DialogContent className="!max-w-4xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto">
      <div className="border-b px-6 py-4">
        <DialogTitle className="text-lg font-semibold text-gray-900">Copy Meal</DialogTitle>
      </div>
      <CopyMealPlansContext
        initialState={initCopyPayload({
          selectedPlan: safeSelectedPlan,
          selectedMeals: selectedPlans?.[safeSelectedPlan] ?? [],
        })}
      >
        <Container />
      </CopyMealPlansContext>
    </DialogContent>
  </Dialog>
}

function Container() {
  const {
    dispatch: copyDispatch,
    selectedMeals: selectedMealsToDisplay,
    selectedPlan: sourcePlan,
    initialSnapshot,
  } = useCopyMealPlan()
  const { selectedPlans, dispatch: mealPlanDispatch } = useCurrentStateContext();
  const planDays = Object.keys(selectedPlans ?? {});
  const closeRef = useRef();

  const handleAddSourceSlot = (planKey) => {
    copyDispatch(addCopySourceSlot({
      plan: planKey,
      planMeals: selectedPlans?.[planKey] ?? [],
    }));
  }

  useEffect(() => {
    if (!sourcePlan && planDays.length) {
      const fallbackPlan = planDays[0];
      copyDispatch(setCopySourcePlan(fallbackPlan, selectedPlans?.[fallbackPlan] ?? []));
    }
  }, [copyDispatch, planDays, selectedPlans, sourcePlan]);

  const handleReplaceMeals = () => {
    const replacements = selectedMealsToDisplay
      .map((slot) => {
        if (!slot.sourcePlan) return null;
        if (typeof slot.sourceMealIndex !== "number" || Number.isNaN(slot.sourceMealIndex)) return null;
        if (!slot.toDate) return null;

        const mealType = slot.toMealType || slot.fromMealType;
        if (!mealType) return null;

        return {
          fromPlan: slot.sourcePlan,
          fromMealIndex: slot.sourceMealIndex,
          toPlan: slot.toDate,
          toMealType: mealType,
        };
      })
      .filter(Boolean);

    if (!replacements.length) return;

    mealPlanDispatch(replaceMealPlanSelections(replacements));
    closeRef.current.click();
  }

  const isReplaceDisabled = !selectedMealsToDisplay.some((slot) =>
    slot.sourcePlan
    && typeof slot.sourceMealIndex === "number"
    && slot.toDate
    && (slot.toMealType || slot.fromMealType),
  );

  return <div className="px-6 pt-0 py-5">
    <DialogClose ref={closeRef} />
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <Label className="text-sm font-semibold text-gray-700" htmlFor="copy-from-day">
          Copy From
          <span className="ml-0.5 text-destructive">*</span>
        </Label>
        <Select
          value={sourcePlan || (planDays.length ? planDays[0] : undefined)}
          onValueChange={(value) => {
            copyDispatch(setCopySourcePlan(value, selectedPlans?.[value] ?? []));
          }}
          disabled={!planDays.length}
        >
          <SelectTrigger id="copy-from-day" className="min-w-[180px]">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {planDays.length === 0 && <SelectItem value="day-1">Day 1</SelectItem>}
            {planDays.map((day) => (
              <SelectItem key={day} value={day}>{day.at(0)?.toUpperCase() + day.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          key={`add-slot-${selectedMealsToDisplay.length}`}
          onValueChange={handleAddSourceSlot}
          disabled={!planDays.length}
        >
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Add copy from slot" />
          </SelectTrigger>
          <SelectContent>
            {!planDays.length && (
              <SelectItem disabled value="__no-plans">No plans available</SelectItem>
            )}
            {planDays.map((day) => (
              <SelectItem key={day} value={day}>
                {typeof day === "string"
                  ? day.at(0)?.toUpperCase() + day.slice(1)
                  : day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="destructive"
          onClick={() => copyDispatch(resetCopySelections(initialSnapshot))}
        >
          Reset
        </Button>
      </div>
    </div>

    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center
                    bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span>Copy From Meal(s)</span>
        <span>Copy to Meal(s)</span>
        <span>Copy to Date(s)</span>
      </div>
      {selectedMealsToDisplay.length > 0
        ? <div className="divide-y">
          {selectedMealsToDisplay.map((slot) => <CopyMealPlanSlot
            key={slot.id}
            slot={slot}
            dispatch={copyDispatch}
          />)}
        </div>
        : <div className="px-4 py-6 text-sm text-muted-foreground">
          No copy slots yet. Use "Add copy from slot" to choose meal sources.
        </div>}
    </div>
    <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
      <Button
        variant="wz"
        className="min-w-[150px]"
        disabled={isReplaceDisabled}
        onClick={handleReplaceMeals}
      >
        Replace
      </Button>
    </div>
  </div>
}

function CopyMealPlanSlot({ slot, dispatch }) {
  const { selectedPlans, mode, selectedPlan } = useCurrentStateContext();

  const possibleModeDays = useMemo(() => possiblePlayDaysForCustomMeal(mode, selectedPlan), [mode])

  const planDays = Object.keys(selectedPlans ?? {});
  const planMeals = Array.isArray(selectedPlans?.[slot.sourcePlan])
    ? selectedPlans[slot.sourcePlan]
    : [];
  const boundedMealIndex = planMeals.length
    ? Math.min(Math.max(slot.sourceMealIndex ?? 0, 0), planMeals.length - 1)
    : -1;
  const currentSourceMeal = boundedMealIndex >= 0 ? planMeals[boundedMealIndex] : null;
  const canAddDestination = Boolean(slot.sourcePlan && boundedMealIndex >= 0);

  const formatDayLabel = (value) => typeof value === "string"
    ? value.at(0)?.toUpperCase() + value.slice(1)
    : value;

  const formatMealLabel = (meal) => {
    const mealType = typeof meal === "string"
      ? meal
      : meal?.mealType ?? meal?.fromMealType ?? slot.fromMealType ?? "";
    return mealType
      ? mealType.at(0)?.toUpperCase() + mealType.slice(1)
      : "Unknown meal";
  }

  const handlePlanChange = (value) => {
    dispatch(updateSlotSourcePlan({
      id: slot.id,
      plan: value,
      planMeals: selectedPlans?.[value] ?? [],
    }));
  }

  const handleMealChange = (value) => {
    const index = Number(value);
    if (Number.isNaN(index)) return;

    dispatch(updateSlotSourceMeal({
      id: slot.id,
      mealIndex: index,
      planMeals,
    }));
  }

  const handleAddDestination = () => {
    if (!canAddDestination) return;

    dispatch(duplicateCopySlot({
      afterId: slot.id,
      sourcePlan: slot.sourcePlan,
      sourceMealIndex: boundedMealIndex,
      meal: currentSourceMeal,
    }));
  }

  const handleRemoveSlot = () => {
    dispatch(removeCopySlot(slot.id));
  }
  return <div key={slot.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-4 bg-white px-4 py-3">
    <div className="grid gap-2">
      {/* <Select
        value={slot.sourcePlan || undefined}
        onValueChange={handlePlanChange}
        disabled={!planDays.length}
      >
        <SelectTrigger className="w-full justify-between">
          <SelectValue placeholder="Select plan" />
        </SelectTrigger>
        <SelectContent>
          {!planDays.length && (
            <SelectItem disabled value="__no-plans">No plans available</SelectItem>
          )}
          {planDays.map((day) => (
            <SelectItem key={day} value={day}>
              {formatDayLabel(day)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}
      <Select
        value={boundedMealIndex >= 0 ? String(boundedMealIndex) : undefined}
        onValueChange={handleMealChange}
        disabled={!planMeals.length}
      >
        <SelectTrigger className="w-full justify-between">
          <SelectValue placeholder={planMeals.length ? "Select meal" : "No meals available"} />
        </SelectTrigger>
        <SelectContent>
          {!planMeals.length && (
            <SelectItem disabled value="__no-meals">No meals available</SelectItem>
          )}
          {planMeals.map((meal, index) => (
            <SelectItem key={`${slot.id}-${index}`} value={String(index)}>
              {formatMealLabel(meal)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleAddDestination}
          disabled={!canAddDestination}
        >
          Add Destination
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={handleRemoveSlot}
        >
          Remove
        </Button>
      </div>
    </div>
    <Select
      value={slot.toMealType || undefined}
      onValueChange={(value) => dispatch(updateSlotMealType(slot.id, value))}
      disabled={!slot.toDate}
    >
      <SelectTrigger className="w-full justify-between">
        <SelectValue placeholder={slot.toDate ? "Select meal" : "Select date first"} />
      </SelectTrigger>
      <SelectedSlotMealTypeOptions plan={slot.toDate} />
    </Select>
    <Select
      value={slot.toDate || undefined}
      onValueChange={(value) => dispatch(updateSlotDate(slot.id, value))}
      disabled={!possibleModeDays.length}
    >
      <SelectTrigger className="w-full justify-between text-muted-foreground">
        <SelectValue placeholder="Nothing selected" />
      </SelectTrigger>
      <SelectContent>
        {!possibleModeDays.length && (
          <SelectItem disabled value="__no-days">No days available</SelectItem>
        )}
        {possibleModeDays.map((day) => (
          <SelectItem
            key={day}
            value={day}
          >
            {typeof day === "string"
              ? day.at(0)?.toUpperCase() + day.slice(1)
              : day}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
}

function SelectedSlotMealTypeOptions({ plan }) {
  const { selectedPlans, selectedPlan } = useCurrentStateContext();
  const options = plan
    ? selectedPlans?.[plan] ?? selectedPlans?.[selectedPlan] ?? defaultMealTypes
    : selectedPlans?.[selectedPlan] ?? defaultMealTypes
  const updatedOptions = Array.isArray(options) ? options : options.meals;
  const uniqueMealTypes = Array.from(new Set(updatedOptions?.map((meal) => typeof meal === "string"
    ? meal
    : meal?.mealType ?? meal?.fromMealType ?? ""
  ))).filter(Boolean)

  return <SelectContent>
    {uniqueMealTypes.length === 0 && (
      <SelectItem disabled value="__no-meals">No meals available</SelectItem>
    )}
    {uniqueMealTypes.map((mealType) => (
      <SelectItem key={`${plan}-${mealType}`} value={mealType}>
        {typeof mealType === "string"
          ? mealType.at(0)?.toUpperCase() + mealType.slice(1)
          : mealType}
      </SelectItem>
    ))}
  </SelectContent>
}

const possiblePlayDaysForCustomMeal = function (mode, ddMMyyyy) {
  switch (mode) {
    case "weekly":
      return [
        "mon", "tue", "wed",
        "thu", "fri", "sat", "sun",
      ]
    case "monthly":
      const date = parse(ddMMyyyy, "dd-MM-yyyy", new Date());
      const daysInMonth = getDaysInMonth(date);
      const year = date.getFullYear();
      const month = date.getMonth();

      return Array.from({ length: daysInMonth }, (_, i) => {
        const currentDate = new Date(year, month, i + 1);
        return format(currentDate, 'dd-MM-yyyy');
      });


    default:
      break;
  }
}