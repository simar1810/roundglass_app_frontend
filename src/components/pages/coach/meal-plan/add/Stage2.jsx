import useCurrentStateContext from "@/providers/CurrentStateContext"
import MonthlyMealCreation from "./MonthlyMealCreation";
import { Button } from "@/components/ui/button";
import { customWorkoutUpdateField, dailyMealRP, mealPlanCreationRP } from "@/config/state-reducers/custom-meal";
import WeeklyMealCreation from "./WeeklyMealCreation";
import CustomMealMetaData from "./CustomMealMetaData";
import SelectMeals from "./SelectMeals";
import { useState } from "react";
import { toast } from "sonner";
import { sendData, uploadImage } from "@/lib/api";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { format24hr_12hr } from "@/lib/formatter";

export default function Stage2() {
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();
  const component = selectWorkoutCreationComponent(state.mode);
  const { cache } = useSWRConfig();

  const router = useRouter();

  async function saveCustomWorkout() {
    try {
      for (const field of ["title", "description"]) {
        if (!Boolean(state[field])) throw new Error(`${field} - for the meal plan is required!`);
      }

      for (const day in state.selectedPlans) {
        if (state.selectedPlans[day]?.length === 0) throw new Error(`There are no plans assigned for the day - ${day}!`)
        for (const mealType of state.selectedPlans[day]) {
          if (mealType.meals.length === 0) throw new Error(`On ${day}, for ${mealType.mealType} at least one meal should be assigned!`);
          for (const meal of mealType.meals) {
            for (const field of ["time", "dish_name"]) {
              if (!meal[field]) throw new Error(`${field} should be selected for all the meals. Not provided for ${mealType.mealType}`)
            }
            if (!meal._id && !meal.mealId) throw new Error(`Please select a dish from the options`);
            meal.meal_time = format24hr_12hr(meal.time)
          }
        }
      }

      if (["new", "copy_edit"].includes(state.creationType)) {
        newWorkout();
      } else if (["edit"].includes(state.creationType)) {
        editWorkout();
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    }
  }

  async function editWorkout() {
    try {
      setLoading(true);

      let thumbnail;
      if (state.file) {
        const toastId = toast.loading("Uploading Thumbnail...");
        thumbnail = await uploadImage(state.file)
        dispatch(customWorkoutUpdateField("image", thumbnail.img))
        toast.dismiss(toastId);
      }

      const toastId = toast.loading("Creating The Custom Meal Plan...");
      const formData = dailyMealRP(state);
      const response = await sendData(`app/meal-plan/custom`, {
        ...formData,
        image: thumbnail?.img,
        plans: state.selectedPlans,
        id: state.id
      }, "PUT");
      toast.dismiss(toastId);
      if (response.status_code !== 200) throw new Error(response.message);
      cache.delete("custom-meal-plans");
      toast.success(response.message);
      router.push(`/coach/meals/list-custom?mode=${state.mode}`)
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  async function newWorkout() {
    try {
      setLoading(true);
      const plans = {}
      for (const key in state.selectedPlans) {
        const toastId = toast.loading(`Creating Meal Plan - ${key}...`);
        const createdMealPlan = await sendData("app/create-custom-plan", mealPlanCreationRP(state.selectedPlans[key]))
        if (createdMealPlan.status_code !== 200) {
          toast.dismiss(toastId)
          throw new Error(createdMealPlan.message)
        }
        plans[key] = createdMealPlan?.data?.planId
        toast.dismiss(toastId);
      }

      let thumbnail;
      if (state.file) {
        const toastId = toast.loading("Uploading Thumbnail...");
        thumbnail = await uploadImage(state.file)
        dispatch(customWorkoutUpdateField("image", thumbnail.img))
        toast.dismiss(toastId);
      }

      const toastId = toast.loading("Creating The Custom Meal Plan...");
      const formData = dailyMealRP(state);
      const response = await sendData(`app/meal-plan/custom`, {
        ...formData,
        image: thumbnail?.img,
        plans
      });
      toast.dismiss(toastId);
      if (response.status_code !== 200) throw new Error(response.message);
      cache.delete("custom-meal-plans");
      toast.success(response.message);
      router.push(`/coach/meals/list-custom?mode=${state.mode}`);
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  return <div>
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-2 divide-x-2">
        <CustomMealMetaData />
        <div className="pl-8">
          {component}
          <SelectMeals />
          <Button
            disabled={loading}
            variant="wz"
            className="w-full mt-8"
            onClick={saveCustomWorkout}
          >
            Save Meal
          </Button>
        </div>
      </div>
    </div>
  </div>;
}

function selectWorkoutCreationComponent(mode) {
  switch (mode) {
    case "daily":
      return (() => <></>)();
    case "weekly":
      return <WeeklyMealCreation />
    case "monthly":
      return <MonthlyMealCreation />
  }
}