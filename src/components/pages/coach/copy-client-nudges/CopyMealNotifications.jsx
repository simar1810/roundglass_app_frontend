import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mealPlanNudgesInitialState } from "@/config/state-data/copy-meal-nudges";
import { copyMealNudgeReducer } from "@/config/state-reducers/copy-meal-nudges";
import { fetchData, sendData } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

export default function CopyMealNotifications({ clientId }) {
  return <></>
  return <Dialog className="">
    <DialogTrigger asChild>
      <Button className="fon-bold">
        Meal Nudges
      </Button>
    </DialogTrigger>
    <DialogContent className="p-0 ">
      <DialogTitle className="p-4 border-b-1">Copy Meal Plan Nudges</DialogTitle>
      <div className="p-4">
        <Container clientId={clientId} />
      </div>
    </DialogContent>
  </Dialog>
}

function Container({ clientId }) {
  const [loading, setLoading] = useState(false)
  const [selectedMealPlans, setSelectedPlans] = useState()
  const { isLoading, error, data } = useSWR(
    `notification-copy/meal-plan/${clientId}`,
    () => fetchData(`app/notification-copy/meal-plan/${clientId}`)
  );

  if (isLoading) return <Loader />

  if (error || data?.status_code !== 200) return <div>
    {error || data.message}
  </div>

  const meals = data.data;

  async function saveMealPlan() {
    try {
      setLoading(true);
      const response = await sendData("app/", formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate(`getClientVolumePoints/${_id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message || "Something went wrong")
    }
  }

  return <div>
    <div className="grid grid-cols-2 gap-4">
      {meals.map(meal => <div
        key={meal._id}
        className={cn(
          "bg-[var(--comp-1)] border-1 p-4 cursor-pointer select-none",
          meal._id === selectedMealPlans && "border-[var(--accent-1)] shadow-lg"
        )}
        onClick={() => setSelectedPlans(prev => meal._id === prev ? "" : meal._id)}
      >
        {meal.title}
      </div>)}
    </div>
    {selectedMealPlans && <Button
      variant="wz"
      onClick={saveMealPlan}
      disabled={loading}
    >
      Save
    </Button>}
  </div>
}