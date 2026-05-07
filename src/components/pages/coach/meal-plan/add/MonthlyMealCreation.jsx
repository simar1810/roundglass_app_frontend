import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addNewPlanType, changeMonthlyDate, customWorkoutUpdateField, deleteMonthlyDate, startFromToday } from "@/config/state-reducers/custom-meal";
import { cn } from "@/lib/utils";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Dialog } from "@radix-ui/react-dialog";
import { addDays, format, isBefore, isValid, parse } from "date-fns";
import { Pen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import MealPlanActionsMenu from "./MealPlanActionsMenu";

export default function MonthlyMealCreation({ viewType }) {
  if (viewType === "vertical") return <></>
  const { dispatch, selectedPlans, selectedPlan } = useCurrentStateContext();
  const searchParams = useSearchParams();
  const creationType = searchParams.get("creationType");
  const canStartFromToday = ["copy_edit", "edit"].includes(creationType);

  const days = Object
    .keys(selectedPlans)
    .sort((dateA, dateB) => {
      return isBefore(
        parse(dateA, "dd-MM-yyyy", new Date()),
        parse(dateB, "dd-MM-yyyy", new Date()),
      ) ? -1 : 1
    });

  return <>
    <div className="flex items-center justify-between gap-2">
      <h3 className="mr-auto">Days</h3>
      <MealPlanActionsMenu
        toPlan={selectedPlan}
        showStartFromToday={canStartFromToday}
        onStartFromToday={() => dispatch(startFromToday())}
      />
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-4">
      {days.length === 0 && <div className="bg-[var(--comp-1)] border-1 p-2 rounded-[6px] grow text-center mr-auto"
      >
        Please select a date
      </div>}
      {days.map((day, index) => {
        const parsedDate = parse(day, "dd-MM-yyyy", new Date());
        const formattedDate = isValid(parsedDate) ? format(parsedDate, "EEE, dd MMM") : day;
        
        return <div
          key={index}
          className={cn(
            "pr-4 flex items-center gap-0 rounded-[10px] border-1 border-[var(--accent-1)]",
            selectedPlan === day && "bg-[var(--accent-1)]"
          )}
        >
          <Button
            variant={selectedPlan === day ? "wz" : "wz_outline"}
            onClick={() => dispatch(customWorkoutUpdateField("selectedPlan", day))}
            className="border-0"
          >
            {formattedDate}
          </Button>
        <UpdateDate
          defaultValue={day}
        />
      </div>
      })}
      <AddNextDay selectedPlans={selectedPlans} />
    </div>
  </>
}

export function AddNextDay() {
  const { dispatch, selectedPlans } = useCurrentStateContext();
  const planKeys = Object.keys(selectedPlans);
  const nextDate = useMemo(
    () => findNextDate(planKeys),
    [planKeys.join(',')]
  )
  return <Button
    onClick={() => dispatch(addNewPlanType(nextDate))}
    variant="wz">
    Add Date
  </Button>
}

const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/

function UpdateDate({ defaultValue = "" }) {
  const [value, setValue] = useState(() => {
    if (!regex.test(defaultValue)) return "";
    try {
      const parsed = parse(defaultValue, "dd-MM-yyyy", new Date());
      return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : "";
    } catch {
      return "";
    }
  })
  const { dispatch } = useCurrentStateContext();

  const closeRef = useRef();

  return <Dialog>
    <DialogTrigger asChild>
      <button className="p-2 hover:bg-[var(--comp-1)] rounded transition-colors">
        <Pen
          className="w-[14px] h-[14px]"
        />
      </button>
    </DialogTrigger>
    <DialogContent className="p-0 max-w-md">
      <DialogTitle className="p-4 border-b-1 text-lg font-semibold">Update Date</DialogTitle>
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Date</label>
          <Input
            placeholder="Update Date"
            type="date"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="wz"
            onClick={() => {
              if (!value) return;
              try {
                const parsed = parse(value, "yyyy-MM-dd", new Date());
                if (!isValid(parsed)) {
                  toast.error("Invalid date selected");
                  return;
                }
                dispatch(changeMonthlyDate({
                  prev: defaultValue,
                  new: format(parsed, "dd-MM-yyyy")
                }))
                closeRef.current.click();
              } catch (error) {
                toast.error("Invalid date format");
              }
            }}
            className="flex-1"
          >Save</Button>
          <Button
            variant="destructive"
            onClick={() => {
              dispatch(deleteMonthlyDate(defaultValue));
              closeRef.current.click();
            }}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
      <DialogClose ref={closeRef} />
    </DialogContent>
  </Dialog>
}

function findNextDate(keys) {
  // Handle empty array - return today's date formatted
  if (!keys || keys.length === 0) {
    return format(new Date(), "yyyy-MM-dd");
  }

  // Parse and filter out invalid dates
  const validDates = keys
    .map(date => {
      try {
        const parsed = parse(date, "dd-MM-yyyy", new Date());
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    })
    .filter(date => date !== null);

  // If no valid dates, return today's date
  if (validDates.length === 0) {
    return format(new Date(), "yyyy-MM-dd");
  }

  // Sort dates and get the latest one
  const sortedDates = validDates.sort((dateA, dateB) => 
    isBefore(dateB, dateA) ? -1 : 1
  );
  
  const latestDate = sortedDates[0];
  
  // Validate the date before using it
  if (!isValid(latestDate)) {
    return format(new Date(), "yyyy-MM-dd");
  }

  // Add one day to the latest date
  const nextDate = addDays(latestDate, 1);
  
  // Validate the result before formatting
  if (!isValid(nextDate)) {
    return format(new Date(), "yyyy-MM-dd");
  }

  return format(nextDate, "yyyy-MM-dd");
}