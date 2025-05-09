"use client";
import FormControl from "@/components/FormControl";
import AddMealPlanModal from "@/components/modals/AddMealPlanModal";
import CreateMealModal from "@/components/modals/CreateMealModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addMealPlanInitialState } from "@/config/state-data/add-meal-plan";
import { addMealPlanReducer, addMealType, changeFieldvalue } from "@/config/state-reducers/add-meal-plan";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

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
  const Component = selectDisplayComponent(stage)

  return <div className="content-height-screen bg-white px-0 py-4 border-1 rounded-[10px]">
    {Component && <Component />}
  </div>
}

function selectDisplayComponent(stage) {

  switch (stage) {
    case 1:
      return AddMealPlanModal
    case 2:
      return Stage2
    case 3:
      return CreateMealModal
    default:
      return undefined
  }
}

function Stage2() {
  const { meals, selectedMealType, dispatch } = useCurrentStateContext();

  const selectedMeals = meals.find(item => item.mealType === selectedMealType)?.meals || [];

  return <div>
    <h4 className="pb-2 px-4 border-b-1">Create Meal</h4>
    <div className="p-4">
      <div className="flex gap-2 mb-6">
        {meals.map((meal, index) => <Button
          variant={selectedMealType === meal.mealType ? "wz" : "wz_outline"}
          key={index}
          onClick={() => dispatch(changeFieldvalue("selectedMealType", meal.mealType))}
        >
          {meal.mealType}
        </Button>)}
        <AddMealType />
      </div>
      <div className="min-h-[70vh] flex items-stretch gap-10 overflow-x-auto">
        {selectedMeals.map((item, index) => <MealPlanDetails
          key={item}
          index={index}
        />)}
        <CreateMealModal />
      </div>
      <Button variant="wz" className="block mt-10 ml-auto">Create Plan</Button>
    </div>
  </div>
}

function MealPlanDetails({ index }) {
  return <div
    className="min-w-80 border border-grey-500 rounded-md px-2 py-2 pr-4"
  >
    <div className="border rounded-md p-4 text-center">
      <div className="border border-dashed border-gray-400 py-10 mb-4">
        <p className="text-gray-500">Add your Meal</p>
      </div>
      <Button variant="secondary" size="sm">
        <Upload /> Upload your Own Image
      </Button>
    </div>
    <FormControl
      label="Name"
      name="name"
      placeholder="Enter Name"
      className="[&_.label]:text-[14px] [&_.label]:font-[400] block mb-4"
    />
    <FormControl
      label="Meal Time"
      name="meal_time"
      placeholder="Select Time"
      type="time"
      className="[&_.label]:text-[14px] [&_.label]:font-[400] block mb-4"
    />
    <Label className="mb-2" htmlFor={"meal-plan-description" + index}>Description</Label>
    <Textarea
      id={"meal-plan-description" + index}
      placeholder="Enter description here"
      className="min-h-[140px]"
    />
  </div>
}

function AddMealType() {
  const [type, setType] = useState("");
  const { dispatch } = useCurrentStateContext();
  const closeBtnRef = useRef();

  function triggerAddMealType() {
    dispatch(addMealType(type))
    closeBtnRef.current.click()
  }
  return <Dialog defaultOpen={true}>
    <DialogTrigger className="bg-[var(--comp-1)] px-4 py-2 flex items-center gap-2 rounded-[8px] border-1">
      <Plus />
      Add New Type
    </DialogTrigger>
    <DialogContent className="!max-w-[400px] w-full p-0 gap-0">
      <DialogHeader className="p-4 border-b-1">
        <DialogTitle>Add Type</DialogTitle>
      </DialogHeader>
      <div className="p-4">
        <FormControl
          label="New Type"
          value={type}
          onChange={e => setType(e.target.value)}
          placeholder="Enter new meal type"
        />
        <Button onClick={triggerAddMealType} variant="wz" className="mt-4">Continue</Button>
      </div>
      <DialogClose ref={closeBtnRef} />
    </DialogContent>
  </Dialog>
}