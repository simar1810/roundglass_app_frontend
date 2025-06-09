import { changeWorkoutPlans, customWorkoutUpdateField, weeklyMealRP } from "@/config/state-reducers/custom-meal";
import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useState } from "react";
import { toast } from "sonner";
import WorkoutMetaData from "./WorkoutMetaData";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { getPlans, getWorkouts } from "@/lib/fetchers/app";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import SelectWorkoutCollection from "./SelectWorkoutCollection";
import { DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export default function MonthlyMealCreation() {
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();

  async function saveCustomWorkout() {
    try {
      setLoading(true);
      const formData = weeklyMealRP(state);
      const response = await sendData(`app/meal-plan/custom`, formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  return <div className="max-w-[450px] mx-auto flex flex-col gap-y-4">
    <div>
      <h3>Days</h3>
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {DAYS.map((day, index) => <Button
          key={index}
          variant={state.selectedDate === day ? "wz" : "wz_outline"}
          onClick={() => dispatch(customWorkoutUpdateField("selectedDate", day))}
        >
          {day.at(0).toUpperCase() + day.slice(1)}
        </Button>)}
      </div>
    </div>
    <WorkoutMetaData />
    <SelectWorkouts />
    <Button
      disabled={loading}
      onClick={saveCustomWorkout}
      variant="wz"
    >
      Save
    </Button>
  </div>
}

function SelectWorkouts() {
  const [query, setQuery] = useState("");
  const { dispatch, plans, selectedPlans, selectedDate } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR("getPlans", getPlans);

  if (isLoading) return <ContentLoader />
  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const workoutItems = data.data;
  const selectedWorkouts = plans[selectedDate] ? [plans[selectedDate]] : []

  if (!selectedDate) return null;
  const selectedWorkout = selectedPlans[selectedDate]
  return <div>
    <SelectWorkoutCollection
      workouts={workoutItems}
      selectedWorkouts={selectedWorkouts}
      onChange={(workout) =>
        selectedWorkouts.includes(plans[selectedDate]) && workout._id === plans[selectedDate]
          ? dispatch(changeWorkoutPlans(selectedDate, {}))
          : dispatch(changeWorkoutPlans(selectedDate, workout))
      }>
      {Boolean(selectedWorkouts.length) && <div className="mt-4">
        <DialogTrigger className="w-full flex items-center justify-between gap-2">
          <h3 className="text-left">Select Workout</h3>
          <PlusCircle size={20} className="text-[var(--accent-1)]" />
        </DialogTrigger>
        <div className="mt-3 flex items-center gap-2">
          <Avatar className="w-[40px] h-[40px] border-1">
            <AvatarImage src={selectedWorkout.thumbnail} />
            <AvatarFallback>{nameInitials(selectedWorkout.title || "")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[14px] mb-1">{selectedWorkout.title}</p>
            <p className="text-[10px]">{selectedWorkout.duration}</p>
          </div>
        </div>
      </div>}
    </SelectWorkoutCollection>
  </div >
}