"use client";
import Stage1 from "@/components/pages/coach/meal-plan/add/Stage1";
import Stage2 from "@/components/pages/coach/meal-plan/add/Stage2";
import { customMealIS, customMealReducer } from "@/config/state-reducers/custom-meal";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext"

export default function Page() {
  return <div className="content-container">
    <CurrentStateProvider
      state={customMealIS("new")}
      reducer={customMealReducer}
    >
      <CustomWorkoutContainer />
    </CurrentStateProvider>
  </div>
}

function CustomWorkoutContainer() {
  const { stage } = useCurrentStateContext();
  const Component = selectCreationStage(stage)
  return Component
}

function selectCreationStage(stage) {
  switch (stage) {
    case 1:
      return <Stage1 />
    case 2:
      return <Stage2 />
    default:
      break;
  }
}