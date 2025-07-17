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

export default function Stage2() {
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();
  const component = selectWorkoutCreationComponent(state.mode);

  async function saveCustomWorkout() {
    if (["new", "copy_edit"].includes(state.creationType)) {
      newWorkout()
    } else if (["edit"].includes(state.creationType)) {
      editWorkout()
    }
  }

  async function editWorkout() {
    try {
      setLoading(true);
      const plans = {}
      for (const key in state.selectedPlans) {
        const toastId = toast.loading(`Creating Meal Plan - ${key}...`);
        const createdMealPlan = await sendData("app/create-custom-plan", mealPlanCreationRP(state.selectedPlans[key]))
        if (createdMealPlan.status_code !== 200) throw new Error(createdMealPlan.message)
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
        plans,
        id: state.id
      }, "PUT");
      toast.dismiss(toastId);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
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
      toast.success(response.message);
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