import Loader from "@/components/common/Loader";
import ContentError from "@/components/common/ContentError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchData, sendData } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function CopyMealNotifications({ clientId }) {
  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="wz">
        Meal Nudges
      </Button>
    </DialogTrigger>
    <DialogContent className="!max-w-[600px] w-full max-h-[85vh] overflow-hidden flex flex-col p-0">
      <DialogTitle className="px-6 py-4 border-b bg-[var(--comp-2)] text-lg font-semibold">
        Copy Meal Plan Nudges
      </DialogTitle>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Container clientId={clientId} />
      </div>
    </DialogContent>
  </Dialog>
}

function Container({ clientId }) {
  const [loading, setLoading] = useState(false)
  const [selectedMealPlans, setSelectedPlans] = useState("")
  const closeRef = useRef(null)
  const { isLoading, error, data } = useSWR(
    `notification-copy/meal-plan/${clientId}`,
    () => fetchData(`app/notification-copy/meal-plan/${clientId}`)
  );

  if (isLoading) return <Loader />

  if (error || data?.status_code !== 200) return <ContentError
    className="!max-h-[80px]"
    title={error || data?.message || "Failed to load meal plans"}
  />

  const meals = data?.data || [];

  async function saveMealPlan() {
    try {
      setLoading(true);
      const response = await sendData(
        `app/notification-copy/meal-plan/${clientId}`,
        { 
          clientId, 
          mealId: selectedMealPlans,
          isImageRequired: true // Meal plan nudges always require images
        }
      );
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message || "Meal plan nudges copied successfully!");
      mutate(`client/nudges/${clientId}`);
      if (closeRef.current) {
        closeRef.current.click();
      }
    } catch (error) {
      toast.error(error.message || "Failed to copy meal plan nudges")
    } finally {
      setLoading(false);
    }
  }

  if (meals.length === 0) {
    return <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-sm text-gray-600 text-center">
        No meal plans available to copy nudges from.
      </p>
    </div>
  }

  return <div className="space-y-4">
    <div>
      <label className="text-sm font-medium text-gray-700 mb-3 block">
        Select Meal Plan to Copy Nudges From
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {meals.map(meal => {
          const isSelected = meal._id === selectedMealPlans
          return (
            <div
              key={meal._id}
              className={cn(
                "p-4 rounded-lg border-2 cursor-pointer transition-all",
                isSelected
                  ? "bg-blue-50 border-blue-400 shadow-md"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
              )}
              onClick={() => setSelectedPlans(prev => meal._id === prev ? "" : meal._id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {meal.title || "Untitled Meal Plan"}
                  </p>
                  {meal.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {meal.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    
    {selectedMealPlans && (
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-gray-600">
          {meals.find(m => m._id === selectedMealPlans)?.title || "Selected meal plan"}
        </p>
        <Button
          variant="wz"
          onClick={saveMealPlan}
          disabled={loading}
          className="font-semibold"
        >
          {loading ? "Copying..." : "Copy Nudges"}
        </Button>
      </div>
    )}
    <DialogClose ref={closeRef} className="hidden" />
  </div>
}