import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useCurrentStateContext from "@/providers/CurrentStateContext";

export default function SetMealTimingsDialog({ trigger, open, onOpenChange }) {
  const { selectedPlans, selectedPlan, dispatch } = useCurrentStateContext() ?? {};
  const [activePlan, setActivePlan] = useState("");

  const planKeys = useMemo(
    () => (selectedPlans ? Object.keys(selectedPlans) : []),
    [selectedPlans]
  );

  const formatPlanLabel = useCallback((planKey) => {
    if (planKey === null || planKey === undefined) return "";
    if (typeof planKey !== "string") return String(planKey);
    if (planKey === "daily") return "Daily";
    if (/^\d{2}-\d{2}-\d{4}$/.test(planKey)) return planKey;
    return planKey.charAt(0).toUpperCase() + planKey.slice(1);
  }, []);

  const planEntries = useMemo(
    () =>
      planKeys.map((key) => {
        const planValue = selectedPlans?.[key];
        const mealsArray = Array.isArray(planValue)
          ? planValue
          : Array.isArray(planValue?.meals)
            ? planValue.meals
            : [];

        return {
          key,
          label: formatPlanLabel(key),
          meals: mealsArray,
        };
      }),
    [formatPlanLabel, planKeys, selectedPlans]
  );

  const resolvedActivePlan = useMemo(() => {
    if (activePlan && planKeys.includes(activePlan)) {
      return activePlan;
    }
    return planEntries[0]?.key ?? "";
  }, [activePlan, planEntries, planKeys]);

  useEffect(() => {
    if (!open || !selectedPlans) return;

    let updated = false;

    const plansWithDefaultTimings = Object.entries(selectedPlans).reduce(
      (acc, [planKey, planValue]) => {
        if (Array.isArray(planValue)) {
          let planUpdated = false;

          const mealTypesWithDefaults = planValue.map((mealType) => {
            if (!mealType || typeof mealType !== "object") return mealType;

            const firstMealTime =
              Array.isArray(mealType.meals) && mealType.meals.length > 0
                ? mealType.meals[0]?.time
                : undefined;

            const defaultTiming =
              mealType.defaultMealTiming ??
              (typeof firstMealTime === "string" ? firstMealTime : "");

            if (mealType.defaultMealTiming === defaultTiming) {
              return mealType;
            }

            planUpdated = true;
            return {
              ...mealType,
              defaultMealTiming: defaultTiming,
            };
          });

          if (planUpdated) {
            updated = true;
            acc[planKey] = mealTypesWithDefaults;
            return acc;
          }

          acc[planKey] = planValue;
          return acc;
        }

        if (planValue && typeof planValue === "object") {
          const mealTypes = Array.isArray(planValue.meals) ? planValue.meals : [];
          let planUpdated = false;

          const mealTypesWithDefaults = mealTypes.map((mealType) => {
            if (!mealType || typeof mealType !== "object") return mealType;

            const firstMealTime =
              Array.isArray(mealType.meals) && mealType.meals.length > 0
                ? mealType.meals[0]?.time
                : undefined;

            const defaultTiming =
              mealType.defaultMealTiming ??
              (typeof firstMealTime === "string" ? firstMealTime : "");

            if (mealType.defaultMealTiming === defaultTiming) {
              return mealType;
            }

            planUpdated = true;
            return {
              ...mealType,
              defaultMealTiming: defaultTiming,
            };
          });

          if (planUpdated) {
            updated = true;
            acc[planKey] = {
              ...planValue,
              meals: mealTypesWithDefaults,
            };
            return acc;
          }

          acc[planKey] = planValue;
          return acc;
        }

        acc[planKey] = planValue;
        return acc;
      },
      {}
    );

    if (updated) {
      dispatch?.({
        type: "CUSTOM_MEAL_UPDATE_FIELD",
        payload: {
          name: "selectedPlans",
          value: plansWithDefaultTimings,
        },
      });
    }
  }, [open, selectedPlans, dispatch]);

  useEffect(() => {
    if (!open) return;
    if (!planKeys.length) {
      setActivePlan("");
      return;
    }

    const preferredPlan =
      (selectedPlan && planKeys.includes(selectedPlan) && selectedPlan) || planKeys[0];

    setActivePlan((prev) => (prev && planKeys.includes(prev) ? prev : preferredPlan));
  }, [open, planKeys, selectedPlan]);

  const handleTimingChange = useCallback(
    (planKey, mealTypeName, value) => {
      if (!selectedPlans || !planKey || !mealTypeName || typeof mealTypeName !== "string") {
        return;
      }

      const planValue = selectedPlans[planKey];
      if (!planValue) return;

      const sanitizedValue = typeof value === "string" ? value : "";

      const updateMealType = (mealType) => {
        if (!mealType || typeof mealType !== "object") return mealType;
        if (mealType.mealType !== mealTypeName) return mealType;

        const existingValue =
          typeof mealType.defaultMealTiming === "string"
            ? mealType.defaultMealTiming
            : "";

        if (existingValue === sanitizedValue) {
          return mealType;
        }

        return {
          ...mealType,
          defaultMealTiming: sanitizedValue,
        };
      };

      let nextPlanValue = planValue;
      let hasChanges = false;

      if (Array.isArray(planValue)) {
        const updatedMealTypes = planValue.map((mealType) => {
          const updatedMealType = updateMealType(mealType);
          if (updatedMealType !== mealType) {
            hasChanges = true;
          }
          return updatedMealType;
        });

        if (!hasChanges) return;
        nextPlanValue = updatedMealTypes;
      } else if (planValue && typeof planValue === "object") {
        if (!Array.isArray(planValue.meals)) return;

        const updatedMealTypes = planValue.meals.map((mealType) => {
          const updatedMealType = updateMealType(mealType);
          if (updatedMealType !== mealType) {
            hasChanges = true;
          }
          return updatedMealType;
        });

        if (!hasChanges) return;

        nextPlanValue = {
          ...planValue,
          meals: updatedMealTypes,
        };
      } else {
        return;
      }

      dispatch?.({
        type: "CUSTOM_MEAL_UPDATE_FIELD",
        payload: {
          name: "selectedPlans",
          value: {
            ...selectedPlans,
            [planKey]: nextPlanValue,
          },
        },
      });
    },
    [dispatch, selectedPlans]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl gap-0 p-0 overflow-x-hidden max-h-[80vh] overflow-y-auto">
        <div className="border-b px-6 py-4">
          <DialogTitle>Set Meal Timings</DialogTitle>
          <DialogDescription>
            Choose a default time for each meal type. Newly added recipes inherit these timings.
          </DialogDescription>
        </div>
        <div className="px-6 py-5">
          {planEntries.length === 0 ? (
            <div className="flex min-h-[140px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No meal plans available yet.
            </div>
          ) : (
            <Tabs value={resolvedActivePlan} onValueChange={setActivePlan} className="gap-5">
              {planEntries.length > 1 && (
                <TabsList className="mb-2 w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                  {planEntries.map(({ key, label }) => (
                    <TabsTrigger key={key} value={key} className="min-w-[120px]">
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
              {planEntries.map(({ key, meals, label }) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <div className="mb-4 text-sm font-semibold text-muted-foreground">
                    {label}
                  </div>
                  {meals.length === 0 ? (
                    <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      No meal types configured for this plan yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {meals.map((mealType, index) => {
                        const mealName =
                          typeof mealType?.mealType === "string"
                            ? mealType.mealType
                            : `Meal ${index + 1}`;
                        const inputId = `default-time-${key}-${index}`;
                        const value =
                          typeof mealType?.defaultMealTiming === "string"
                            ? mealType.defaultMealTiming
                            : "";

                        return (
                          <div
                            key={`${key}-${mealName}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3"
                          >
                            <div className="min-w-[180px]">
                              <p className="text-sm font-semibold text-foreground">{mealName}</p>
                              {Array.isArray(mealType?.meals) && mealType.meals.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  First meal time:{" "}
                                  {mealType.meals[0]?.time
                                    ? mealType.meals[0]?.time
                                    : "Not set"}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-1 min-w-[220px] flex-col gap-1">
                              <Label htmlFor={inputId} className="text-xs uppercase text-muted-foreground">
                                Default Timing
                              </Label>
                              <Input
                                id={inputId}
                                inputMode="time"
                                type="time"
                                placeholder="e.g. 08:30 AM"
                                value={value}
                                onChange={(event) =>
                                  handleTimingChange(key, mealType?.mealType, event.target.value)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="secondary" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

