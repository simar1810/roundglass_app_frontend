import { Button } from "@/components/ui/button";
import { saveWorkout } from "@/config/state-reducers/custom-workout";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { PlusCircle } from "lucide-react";
import SelectedWorkoutDetails from "./SelectedWorkoutDetails";

export default function SelecWorkouts() {
  const {
    dispatch,
    plans,
    selectedPlan,
    selectedPlans
  } = useCurrentStateContext();

  const workouts = selectedPlans[selectedPlan]

  return <div>
    <div className="pt-4 flex gap-4 overflow-x-auto no-scrollbar">
      <h3>Select Workouts</h3>
    </div>
    {workouts.map((workout, index) => <SelectedWorkoutDetails
      key={index}
      index={index}
      workout={workout}
    />)}
    <div>
    </div>
    <Button
      onClick={() => dispatch(saveWorkout({}))}
      className="bg-transparent hover:bg-transparent w-full h-[120px] border-1 mt-4 flex items-center justify-center rounded-[8px]"
    >
      <PlusCircle className="min-w-[32px] min-h-[32px] text-[var(--accent-1)]" />
    </Button>
  </div>
}