import ContentError from "@/components/common/ContentError"
import ContentLoader from "@/components/common/ContentLoader"
import FormControl from "@/components/FormControl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sendData } from "@/lib/api"
import { getPlans, getWorkouts } from "@/lib/fetchers/app"
import { nameInitials } from "@/lib/formatter"
import { PlusCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { changeWorkoutPlans, customWorkoutUpdateField, dailyMealRP, removeWorkoutFromPlans } from "@/config/state-reducers/custom-meal"
import useCurrentStateContext from "@/providers/CurrentStateContext"
import SelectWorkoutCollection from "./SelectWorkoutCollection"

export default function DailyMealCreation() {
  const [details, setDetails] = useState(generateSingleWorkoutDetails);
  const [loading, setLoading] = useState(false);
  const { dispatch, ...state } = useCurrentStateContext();

  async function saveCustomWorkout() {
    try {
      setLoading(true);
      const formData = dailyMealRP(state);
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
    <FormControl
      value={state.title}
      onChange={e => dispatch(customWorkoutUpdateField("title", e.target.value))}
      placeholder="Enter title"
      label="Title"
    />
    <div>
      <Label className="font-bold mb-2">Description</Label>
      <Textarea
        value={state.description}
        onChange={e => dispatch(customWorkoutUpdateField("description", e.target.value))}
        placeholder="Enter Description"
        label="Description"
        className="min-h-[120px]"
      />
      <SelectWorkouts />
    </div>
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

function generateSingleWorkoutDetails() {
  return {
    title: "",
    thumbnail: "",
    workouts: [],
    instructions: "",
    selectedWorkouts: [],
  }
}

function SelectWorkouts() {
  const [query, setQuery] = useState("");
  const { dispatch, plans, selectedPlans } = useCurrentStateContext();

  const { isLoading, error, data } = useSWR("getPlans", getPlans);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const workoutItems = data.data;
  const selectedWorkouts = plans.daily ? [plans.daily] : []

  return <div>
    <SelectWorkoutCollection
      workouts={workoutItems}
      selectedWorkouts={selectedWorkouts}
      onChange={(workout) => selectedWorkouts.includes(workout._id)
        ? dispatch(removeWorkoutFromPlans("daily"))
        : dispatch(changeWorkoutPlans("daily", workout))
      }
    >
      {selectedPlans.daily && <div className="mt-4">
        <DialogTrigger className="w-full flex items-center justify-between gap-2">
          <h3 className="text-left">Select Workout</h3>
          <PlusCircle size={32} className="text-[var(--accent-1)]" />
        </DialogTrigger>
        <div className="mt-3 flex items-center gap-2">
          <Avatar className="w-[40px] h-[40px] border-1">
            <AvatarImage src={selectedPlans.daily.thumbnail} />
            <AvatarFallback>{nameInitials(selectedPlans.daily.title || "")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[14px] mb-1">{selectedPlans.daily.title}</p>
            <p className="text-[10px]">{selectedPlans.daily.duration}</p>
          </div>
        </div>
      </div>}
    </SelectWorkoutCollection>
  </div>
}