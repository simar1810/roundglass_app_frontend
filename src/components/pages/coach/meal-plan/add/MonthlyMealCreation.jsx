import { customWorkoutUpdateField, dailyMealRP, mealPlanCreated, mealPlanCreationRP } from "@/config/state-reducers/custom-meal";
import { sendData, uploadImage } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useState } from "react";
import { toast } from "sonner";
import CustomMealMetaData from "./CustomMealMetaData";
import { Button } from "@/components/ui/button";
import SelectMeals from "./SelectMeals";
import AddDayModal from "./AddDayModal";

export default function MonthlyMealCreation() {
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

  const days = Object.keys(state.selectedPlans);

  return <div className="flex flex-col gap-y-4">
    <div className="grid grid-cols-2 divide-x-2">
      <CustomMealMetaData />
      <div className="pl-8">
        <h3>Days</h3>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {days.map((day, index) => <Button
            key={index}
            variant={state.selectedPlan === day ? "wz" : "wz_outline"}
            onClick={() => dispatch(customWorkoutUpdateField("selectedPlan", day))}
          >
            {day.at(0).toUpperCase() + day.slice(1)}
          </Button>)}
          <AddDayModal />
        </div>
        <SelectMeals />
        <Button
          disabled={loading}
          variant="wz"
          className="w-full mt-8"
          onClick={saveCustomWorkout}
        >
          Save
        </Button>
      </div>
    </div>
  </div>
}