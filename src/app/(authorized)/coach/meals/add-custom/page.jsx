"use client";
import Stage1 from "@/components/pages/coach/meal-plan/add/Stage1";
import Stage2 from "@/components/pages/coach/meal-plan/add/Stage2";
import { changeStateDifferentCreationMeal, customMealIS, customMealReducer, selectWorkoutType } from "@/config/state-reducers/custom-meal";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import { SAVED_MEAL_PLAN_STORAGE_KEY } from "@/config/state-data/custom-meal";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext"
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Page() {
  return <div className="content-container content-height-screen">
    <CurrentStateProvider
      state={customMealIS("new")}
      reducer={customMealReducer}
      localStorageHydrateKey={SAVED_MEAL_PLAN_STORAGE_KEY}
    >
      <CustomWorkoutContainer />
    </CurrentStateProvider>
  </div>
}

function CustomWorkoutContainer() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode")
  const creationType = searchParams.get("creationType");
  const mealId = searchParams.get("mealId")
  const router = useRouter();

  const { dispatch, stage } = useCurrentStateContext();
  const Component = selectCreationStage(stage)

  useEffect(function () {
    ; (async function () {
      if (["edit", "copy_edit"].includes(creationType) && Boolean(mealId)) {
        const response = await getCustomMealPlans("coach", mealId)
        if (response.status_code !== 200) {
          toast.error(response.message);
          router.push("/coach/meals/list-custom");
        }
        const mealPlan = response.data
        const plans = {};
        const editPlans = {}
        for (const field in mealPlan.plans) {
          plans[field] = mealPlan.plans[field].meals || []
          editPlans[field] = mealPlan.plans[field]._id
        }
        dispatch(changeStateDifferentCreationMeal({
          mode,
          creationType,
          selectedPlans: plans,
          editPlans: editPlans,
          selectedPlan: Object.keys(plans)?.at(0),
          selectedMealType: Object.values(plans)?.at(0)?.at(0)?.mealType,
          thumbnail: mealPlan.image,
          title: mealPlan.title,
          description: mealPlan.description,
          guidelines: mealPlan.guidelines,
          supplements: mealPlan.supplements,
          id: mealPlan._id,
          // For non-draft plans, remember the original plan id so that
          // autosave can work on a separate draft copy without touching
          // the assigned/original plan until explicit Save.
          originalPlanId: creationType === "edit" && !mealPlan.draft ? mealPlan._id : undefined,
          noOfDays: mealPlan.noOfDays,
        }))
      } else if (["daily", "weekly", "monthly"].includes(mode)) {
        dispatch(selectWorkoutType(mode))
      }
    })();
  }, [])

  return Component
}

function selectCreationStage(stage) {
  switch (stage) {
    case 1:
      return <Stage1 />
    case 2:
      return <Stage2 />
    default:
      break;
  }
}