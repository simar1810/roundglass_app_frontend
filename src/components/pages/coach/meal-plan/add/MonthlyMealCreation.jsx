import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useRef, useState } from "react";
import { toast } from "sonner";
import WorkoutMetaData from "./WorkoutMetaData";
import { Button } from "@/components/ui/button";
import FormControl from "@/components/FormControl";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { changeWorkoutPlans, customWorkoutUpdateField, monthlyMealRP } from "@/config/state-reducers/custom-meal";
import useSWR from "swr";
import { getPlans, getWorkouts } from "@/lib/fetchers/app";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import SelectWorkoutCollection from "./SelectWorkoutCollection";
import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";

export default function MonthlyMealCreation() {
  const [loading, setLoading] = useState(false);
  const { dispatch, selectedDate, ...state } = useCurrentStateContext();
  async function saveCustomWorkout() {
    try {
      setLoading(true);
      const formData = monthlyMealRP({ ...state });
      const response = await sendData(`app/meal-plan/custom`, formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  const days = Object.keys(state.plans)

  return <div className="max-w-[450px] mx-auto flex flex-col gap-y-4">
    <h3>Selected Days</h3>
    <div className="flex gap-2">
      {days.map((day, index) => <Button
        key={index}
        variant={selectedDate === day ? "wz" : "wz_outline"}
        onClick={e => dispatch(customWorkoutUpdateField("selectedDate", day))}
      >
        {day}
      </Button>)}
      <AddDayModal />
    </div>
    <WorkoutMetaData />
    <SelectWorkouts />
    <Button disabled={loading} onClick={saveCustomWorkout} variant="wz">Save</Button>
  </div>
}

function AddDayModal() {
  const [day, setDay] = useState("")
  const { dispatch } = useCurrentStateContext()

  const closeBtnRef = useRef(null)

  function handleAddDay() {
    dispatch(changeWorkoutPlans(day, {}))
    closeBtnRef.current.click()
  }

  return <Dialog>
    <DialogTrigger className="text-[var(--accent-1)] text-[14px] px-4 py-2 rounded-[8px] border-1 border-[var(--accent-1)]">
      Add Day
    </DialogTrigger>
    <DialogContent className="max-w-[450px] mx-auto max-h-[75vh] overflow-y-auto p-0 gap-0">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Select Day</DialogTitle>
      </DialogHeader>
      <div className="p-4">
        <FormControl
          value={day}
          type="date"
          onChange={e => setDay(e.target.value)}
          placeholder="Enter Day"
          label="Day"
        />
        <Button
          onClick={handleAddDay}
          variant="wz"
          className="mt-4 mx-auto"
        >
          Add Day
        </Button>
        <DialogClose ref={closeBtnRef} />
      </div>
    </DialogContent>
  </Dialog>
}

function SelectWorkouts() {
  const [query, setQuery] = useState("");
  const { dispatch, plans, selectedPlans, selectedDate } = useCurrentStateContext();
  const { isLoading, error, data } = useSWR("getPlans", getPlans);
  console.log(data)

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