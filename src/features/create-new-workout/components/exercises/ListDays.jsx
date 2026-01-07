import useCurrentStateContext from "@/providers/CurrentStateContext";
import { TabsTrigger } from "@/components/ui/tabs";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { buildDaysListForDaysMenu } from "../../utils/helpers";
import { addDays, format, parse } from "date-fns";
import { Button } from "@/components/ui/button";

export default function ListDays() {
  const state = useCurrentStateContext();
  if (state.mode === "daily") return <div className="text-center font-bold">Daily</div>;
  const days = buildDaysListForDaysMenu(state);
  if (state.mode === "weekly") return <DaysMenu days={days} />;
  return <DaysMenu days={days} />
}

function DaysMenu({ days }) {
  const scrollRef = useRef(null);
  const { mode } = useCurrentStateContext();

  function scroll(dir) {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -120 : 120,
      behavior: "smooth",
    });
  }

  const isMonthly = mode === "monthly";

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={() => scroll("left")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex-1 min-w-0 flex gap-6 overflow-x-auto scrollbar-hide border-b border-border px-1"
      >
        {days.map(day => (<TriggerItem
          key={day}
          day={day}
        />))}
      </div>

      {isMonthly && <AddMonthlyDay />}

      <button
        onClick={() => scroll("right")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function TriggerItem({ day }) {
  const { mode, dispatch } = useCurrentStateContext();
  const isMonthly = mode === "monthly";
  return <div className="flex items-center gap-1">
    <TabsTrigger
      key={day}
      value={day}
      className="
        relative
        whitespace-nowrap
        pb-2
        text-sm
        font-medium
        text-muted-foreground
        transition-colors
        data-[state=active]:text-(--accent-1)
        data-[state=active]:after:absolute
        data-[state=active]:after:left-0
        data-[state=active]:after:right-0
        data-[state=active]:after:-bottom-px
        data-[state=active]:after:h-[2px]
        data-[state=active]:after:bg-(--accent-1)
      "
    >
      {day}
    </TabsTrigger>
    {isMonthly && <Button
      variant="ghost"
      size="icon"
      className="text-white bg-[var(--accent-2)] w-4 h-4"
      onClick={(e) => {
        e.stopPropagation();
        dispatch({
          type: "REMOVE_DAY",
          payload: day
        })
      }}
    >
      <X
        size={12}
        strokeWidth={2}
      />
    </Button>}
  </div>
}

function AddMonthlyDay() {
  const { exercises, dispatch } = useCurrentStateContext();
  function addNewDay() {
    const lastDay = Object.keys(exercises).pop();
    const parsedLastDay = parse(lastDay ?? format(new Date(), "dd-MM-yyyy"), "dd-MM-yyyy", new Date());
    dispatch({
      type: "ADD_NEW_DAY",
      payload: format(addDays(parsedLastDay, 1), "dd-MM-yyyy")
    })
  }
  return <div onClick={addNewDay} className="bg-[var(--accent-1)] text-white rounded-full p-1 cursor-pointer">
    <Plus size={16} strokeWidth={3} />
  </div>
}