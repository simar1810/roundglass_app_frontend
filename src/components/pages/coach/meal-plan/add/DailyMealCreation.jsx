import { Button } from "@/components/ui/button"
import { sendData, uploadImage } from "@/lib/api"
import { useState } from "react"
import { toast } from "sonner"
import { customWorkoutUpdateField, dailyMealRP, mealPlanCreated, mealPlanCreationRP } from "@/config/state-reducers/custom-meal"
import useCurrentStateContext from "@/providers/CurrentStateContext"
import SelectMeals from "./SelectMeals"
import CustomMealMetaData from "./CustomMealMetaData"

export default function DailyMealCreation() {
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();

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
      console.error(error)
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

  return <div className="max-w-[450px] mx-auto flex flex-col gap-y-4">
    <CustomMealMetaData />
    <SelectMeals />
    <Button
      disabled={loading}
      variant="wz"
      className="mt-8"
      onClick={saveCustomWorkout}
    >
      Save Meal
    </Button>
  </div>
}