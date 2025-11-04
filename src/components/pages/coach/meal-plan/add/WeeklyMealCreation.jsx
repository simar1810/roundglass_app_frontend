import { changeSelectedPlan } from "@/config/state-reducers/custom-meal";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Button } from "@/components/ui/button";
import CopyMealPlanModal from "./CopyMealPlanModal";
import CopyMealPlanDays from "./CopyMealPlanDays";

export default function WeeklyMealCreation() {
  const { dispatch, selectedPlan, selectedPlans } = useCurrentStateContext();
  const days = Object.keys(selectedPlans)
  return <>
    <div className="flex items-center justify-between gap-4">
      <h3 className="mr-auto">Days</h3>
      <CopyMealPlanModal to={selectedPlan} />
      <CopyMealPlanDays />
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
      {days.map((day, index) => <Button
        key={index}
        variant={selectedPlan === day ? "wz" : "wz_outline"}
        onClick={() => dispatch(changeSelectedPlan(day))}
      >
        {day.at(0).toUpperCase() + day.slice(1)}
      </Button>)}
    </div>
  </>
}