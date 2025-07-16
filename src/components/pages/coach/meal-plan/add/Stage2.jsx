import useCurrentStateContext from "@/providers/CurrentStateContext"
import DailyMealCreation from "./DailyMealCreation";
import MonthlyMealCreation from "./MonthlyMealCreation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customWorkoutUpdateField } from "@/config/state-reducers/custom-meal";
import WeeklyMealCreation from "./WeeklyMealCreation";

export default function Stage2() {
  const { mode, dispatch, ...state } = useCurrentStateContext();
  const component = selectWorkoutCreationComponent(mode);
  return <div>
    <Button onClick={() => dispatch(customWorkoutUpdateField("stage", 1))} variant="wz" className="mb-4">
      <ArrowLeft />
      Back
    </Button>
    {component}
  </div>;
}

function selectWorkoutCreationComponent(mode) {
  switch (mode) {
    case "daily":
      return <DailyMealCreation />
    case "weekly":
      return <WeeklyMealCreation />
    case "monthly":
      return <MonthlyMealCreation />
  }
}