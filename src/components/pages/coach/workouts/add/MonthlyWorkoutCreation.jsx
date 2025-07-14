import { Button } from "@/components/ui/button"
import { sendData, uploadImage } from "@/lib/api"
import { useState } from "react"
import { toast } from "sonner"
import { customWorkoutUpdateField, dailyWorkoutRP, workoutPlanCreationRP } from "@/config/state-reducers/custom-workout"
import useCurrentStateContext from "@/providers/CurrentStateContext"
import WorkoutMetaData from "./WorkoutMetaData"
import SelectWorkouts from "./SelectWorkouts"
import AddDayModal from "../../meal-plan/add/AddDayModal"

export default function DailyWorkoutCreation() {
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();

  async function saveCustomWorkout() {
    try {
      setLoading(true);
      const plans = {}
      for (const key in state.selectedPlans) {
        const toastId = toast.loading(`Creating Workout Plan - ${key}...`);
        const createdWorkoutPlan = await sendData("app/workout/create-custom-workout", workoutPlanCreationRP(state.selectedPlans[key]))
        if (createdWorkoutPlan.status_code !== 200) throw new Error(createdWorkoutPlan.message)
        plans[key] = createdWorkoutPlan?.data?._id
        toast.dismiss(toastId);
      }

      let thumbnail;
      if (state.file) {
        const toastId = toast.loading("Uploading Thumbnail...");
        thumbnail = await uploadImage(state.file)
        toast.dismiss(toastId);
      }

      const toastId = toast.loading("Creating The Custom Workout Plan...");
      const formData = dailyWorkoutRP(state);
      const response = await sendData(`app/workout/workout-plan/custom`, {
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

  return <div className="max-w-[450px] mx-auto flex flex-col gap-y-4">
    <div>
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
    </div>
    <WorkoutMetaData />
    <SelectWorkouts />
    <Button
      disabled={loading}
      variant="wz"
      className="mt-8"
      onClick={saveCustomWorkout}
    >
      Add Workout
    </Button>
  </div>
}