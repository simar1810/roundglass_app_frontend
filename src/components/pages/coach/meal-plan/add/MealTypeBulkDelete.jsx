import { MultiSearchableSelect } from "@/components/common/selects/MultiSearchableSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { checkArray } from "@/lib/formatter";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Minus, Plus, UtensilsCrossed, X } from "lucide-react";
import { useRef, useState } from "react";

export default function MealTypeBulkDelete({
  trigger,
  open,
  onOpenChange
}) {
  return <Dialog
    open={open}
    onOpenChange={onOpenChange}
  >
    {trigger && <DialogTrigger>
      <Plus />
    </DialogTrigger>}
    <DialogContent className="gap-0 space-y-0 p-0 max-h-[70vh] overflow-y-auto">
      <DialogTitle className="p-4 border-b-1">Bulk Delete Recipes</DialogTitle>
      <Container />
    </DialogContent>
  </Dialog>
}

function Container() {
  const closeRef = useRef();
  const [selectedMealTypes, setSelectedMealTypes] = useState([]);
  const { selectedPlans, dispatch } = useCurrentStateContext();

  const availableMealTypes = buildAvailableMealTypes(selectedPlans, selectedMealTypes);

  const handleRemove = (item) => {
    setSelectedMealTypes(prev => prev.filter(opt => opt !== item));
  };

  return (
    <div className="p-4">
      <div className="min-h-[40px] mb-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          Current Selection
        </label>
        <div className="flex flex-wrap gap-2">
          {selectedMealTypes.length > 0 ? (
            selectedMealTypes.map(item => (
              <span 
                key={item} 
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-blue-50 text-[var(--accent-1)] border border-blue-100 rounded-full text-sm font-medium transition-all hover:bg-blue-100"
              >
                {item}
                <button 
                  onClick={() => handleRemove(item)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">No meal types selected yet...</span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Add Meal Types</label>
        <MultiSearchableSelect
          options={availableMealTypes.map(opt => ({ label: opt, value: opt }))}
          value={selectedMealTypes}
          onValueChange={(val) => setSelectedMealTypes(val)}
          className="w-full transition-shadow focus-within:ring-2 focus-within:ring-blue-100"
          selectLabel="Select Meal Types"
          placeholder="Select Meal Types"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-8">
        <DialogClose asChild>
          <Button 
            ref={closeRef} 
            variant="outline" 
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button 
          variant="wz" 
          className="bg-[var(--accent-1)]/90 hover:bg-[var(--accent-1)] text-white shadow-md shadow-blue-100 transition-transform active:scale-95"
          onClick={() => dispatch({
            type: "BULK_DELETE_MEAL_TYPES",
            payload: { mealTypes: selectedMealTypes }
          })}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}

const buildAvailableMealTypes = function (selectedPlans, selectedMealTypes) {
  const availableMealTypes = new Set();
  for (const day of Object.keys(selectedPlans)) {
    checkArray(selectedPlans[day])
      .forEach(({ mealType }) => availableMealTypes.add(mealType))
  }
  selectedMealTypes.forEach(mealType => availableMealTypes.delete(mealType))
  return [...availableMealTypes]
}