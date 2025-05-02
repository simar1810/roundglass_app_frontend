"use client";
import AddMealPlanModal from "@/components/modals/AddMealPlanModal";
import CreateMealModal from "@/components/modals/CreateMealModal";
import { addMealPlanInitialState } from "@/config/state-data/add-meal-plan";
import { addMealPlanReducer } from "@/config/state-reducers/add-meal-plan";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";

export default function Page() {
  return <CurrentStateProvider
    state={addMealPlanInitialState}
    reducer={addMealPlanReducer}
  >
    <AddMealPlanContainer />
  </CurrentStateProvider>
}

function AddMealPlanContainer() {
  const { stage } = useCurrentStateContext();
  console.log(stage)
  const Component = selectDisplayComponent(stage)

  return <div className="content-height-screen bg-white p-4 border-1 rounded-[10px]">
    {Component && <Component />}
  </div>
}

function selectDisplayComponent(stage) {
  switch (stage) {
    case 1:
      return AddMealPlanModal
    case 2:
      return CreateMealModal
    default:
      return undefined
  }
}