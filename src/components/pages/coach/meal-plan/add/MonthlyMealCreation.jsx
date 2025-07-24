import { customWorkoutUpdateField } from "@/config/state-reducers/custom-meal";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Button } from "@/components/ui/button";
import AddDayModal from "./AddDayModal";
import CopyMealPlanModal from "./CopyMealPlanModal";

export default function MonthlyMealCreation() {
  const { dispatch, selectedPlans, selectedPlan, } = useCurrentStateContext();

  const days = Object.keys(selectedPlans);

  return <>
    <div className="flex items-center justify-between">
      <h3 className="mt-4">Days</h3>
      <CopyMealPlanModal to={selectedPlan} />
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
      {days.map((day, index) => <Button
        key={index}
        variant={selectedPlan === day ? "wz" : "wz_outline"}
        onClick={() => dispatch(customWorkoutUpdateField("selectedPlan", day))}
      >
        {day.at(0).toUpperCase() + day.slice(1)}
      </Button>)}
      <AddDayModal />
    </div>
  </>
}