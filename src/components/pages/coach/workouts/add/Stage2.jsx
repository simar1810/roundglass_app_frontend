import useCurrentStateContext from "@/providers/CurrentStateContext"
import DailyWorkoutCreation from "./DailyWorkoutCreation";
import WeeklyWorkoutCreation from "./WeeklyWorkoutCreation";
import MonthlyWorkoutCreation from "./MonthlyWorkoutCreation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customWorkoutUpdateField } from "@/config/state-reducers/custom-workout";

export default function Stage2() {
  const { mode, dispatch } = useCurrentStateContext();
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
      return <DailyWorkoutCreation />
    case "weekly":
      return <WeeklyWorkoutCreation />
    case "monthly":
      return <MonthlyWorkoutCreation />
  }
}