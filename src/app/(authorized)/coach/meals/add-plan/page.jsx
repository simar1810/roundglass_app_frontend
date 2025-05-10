"use client";
import FormControl from "@/components/FormControl";
import AddMealPlanModal from "@/components/modals/AddMealPlanModal";
import AddRecipe from "@/components/modals/AddRecipe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addMealPlanInitialState } from "@/config/state-data/add-meal-plan";
import {
  addMealPlanReducer,
  addMealType,
  addNewRecipeBlank,
  changeFieldvalue,
  changeRecipeFieldValue,
  generateRequestPayload,
  removeSelectedRecipe
} from "@/config/state-reducers/add-meal-plan";
import { sendData, sendDataWithFormData } from "@/lib/api";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { ClockFading, Plus, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  return <CurrentStateProvider
    state={addMealPlanInitialState}
    reducer={addMealPlanReducer}
  >
    <AddMealPlanContainer />
  </CurrentStateProvider>
}

export function AddMealPlanContainer() {
  const { stage } = useCurrentStateContext();
  const Component = selectDisplayComponent(stage);

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
      return AddRecipe
    default:
      return undefined;
  }
}

function Stage2() {
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const { meals, selectedMealType, dispatch, ...state } = useCurrentStateContext();

  const selectedMeals = meals.find(item => item.mealType === selectedMealType)?.meals || [];

  async function createMealPlan() {
    const toastId = toast.loading("Creating meal plan. Please wait!");
    try {
      setLoading(true);
      const payload = generateRequestPayload({ ...state, meals })
      if (!payload.success) throw new Error(`Field ${payload.field} is required!`);
      const response = await sendData("app/create-plan", payload.data);
      if (response.status_code !== 200) throw new Error(response.message)
      toast.success(response.message || "Successfully created the meal plan!");
      router.push("/coach/meals/list")
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    } finally {
      setLoading(false);
      toast.dismiss(toastId);
    }
  }

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
        {selectedMeals.map((recipe, index) => <RecipeDetails
          key={recipe.id}
          recipe={recipe}
          index={index}
        />)}
        <div className="min-w-80 flex flex-col items-center justify-center">
          <div
            onClick={() => dispatch(addNewRecipeBlank((Math.random() * 1000000).toFixed(0)))}
            className="bg-[var(--comp-3)]/40 rounded-full mb-4 p-4 cursor-pointer"
          >
            <Plus />
          </div>
          <h3>Add More recipes</h3>
        </div>
      </div>
      <Button disabled={loading} onClick={createMealPlan} variant="wz" className="block mt-10 ml-auto">Create Plan</Button>
    </div>
  </div>
}

function RecipeDetails({ recipe, index }) {
  const { dispatch } = useCurrentStateContext();

  const selectRecipeImageRef = useRef();

  async function uploadRecipeThumbnail(e) {
    try {
      const data = new FormData();
      data.append("file", e.target.files[0])
      const response = await sendDataWithFormData("app/getPlanImageWeb", data);
      if (response.status_code !== 200) throw new Error(response.message)
      dispatch(changeRecipeFieldValue(recipe.id, "image", response.img))
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    }
  }

  return <div className="min-w-96 max-w-96 border border-grey-500 rounded-md px-2 py-2 pr-4 relative">
    <X
      className="absolute top-[2px] right-[2px] cursor-pointer"
      onClick={() => dispatch(removeSelectedRecipe(recipe.id))}
    />
    <div className="w-full border rounded-md p-4 text-center">
      <AddRecipe id={index} recipe={recipe} />
      <input
        type="file"
        hidden
        ref={selectRecipeImageRef}
        onChange={uploadRecipeThumbnail}
      />
      <Button onClick={() => selectRecipeImageRef.current.click()} variant="wz_outline" size="sm">
        <Upload className="w-[16px] h-[16px]" /> Upload your Own Image
      </Button>
    </div>
    <FormControl
      label="Name"
      name="name"
      placeholder="Enter Name"
      value={recipe.name}
      onChange={e => dispatch(changeRecipeFieldValue(recipe.id, "name", e.target.value))}
      className="[&_.label]:text-[14px] [&_.label]:font-[400] block mb-4"
    />
    <FormControl
      value={recipe.meal_time}
      onChange={e => dispatch(changeRecipeFieldValue(recipe.id, "meal_time", e.target.value))}
      label="Meal Time"
      name="meal_time"
      placeholder="Select Time"
      type="time"
      className="[&_.label]:text-[14px] [&_.label]:font-[400] block mb-4"
    />
    <Label className="mb-2" htmlFor={"meal-plan-description" + index}>Description</Label>
    <Textarea
      value={recipe.description}
      onChange={e => dispatch(changeRecipeFieldValue(recipe.id, "description", e.target.value))}
      id={"meal-plan-description" + index}
      placeholder="Enter description here"
      className="h-[180px]"
    />
  </div>
}

function AddMealType() {
  const [type, setType] = useState("");
  const { dispatch, meals } = useCurrentStateContext();
  const closeBtnRef = useRef();

  function triggerAddMealType() {
    if (!type) toast.error("Type cannot be empty!")
    else if (meals.find(meal => meal.mealType === type)) toast.error("This type is already selected!")
    else {
      dispatch(addMealType(type));
      setType("");
      closeBtnRef.current.click();
    }
  }

  return <Dialog defaultOpen={true}>
    <DialogTrigger className="bg-[var(--comp-1)] text-[14px] px-4 py-2 rounded-[8px] border-1">
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