import useCurrentStateContext from "@/providers/CurrentStateContext";
import { WORKOUT_WEEKLY_DAYS } from "../../utils/config";
import { TabsTrigger } from "@/components/ui/tabs";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ListDays() {
  const { mode } = useCurrentStateContext();

  if (mode === "daily") return null;
  if (mode === "weekly") return <WeeklyDays />;
  if (mode === "monthly") return null;

  throw new Error("Invalid mode");
}
function WeeklyDays() {
  const scrollRef = useRef(null);

  function scroll(dir) {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -120 : 120,
      behavior: "smooth",
    });
  }

  return (
    <div className="flex items-center gap-2 w-[99%]">
      <button
        onClick={() => scroll("left")}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide border-b border-border px-1"
      >
        {WORKOUT_WEEKLY_DAYS.map(day => (
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
              data-[state=active]:text-[var(--accent-1)]
              data-[state=active]:after:absolute
              data-[state=active]:after:left-0
              data-[state=active]:after:right-0
              data-[state=active]:after:-bottom-[1px]
              data-[state=active]:after:h-[2px]
              data-[state=active]:after:bg-[var(--accent-1)]
            "
          >
            {day}
          </TabsTrigger>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
