"use client"

import { useState } from "react"
import { CalendarIcon, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { cn } from "@/lib/utils"
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay } from "date-fns"

export default function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  showQuickFilters = true
}) {
  const [open, setOpen] = useState(false);
  const { from, to } = dateRange || {};

  const displayText = () => {
    if (!from && !to) {
      return "Select date range";
    }
    if (from && !to) {
      return `${format(from, "dd-MM-yyyy")} - ...`;
    }
    if (from && to) {
      return `${format(from, "dd-MM-yyyy")} - ${format(to, "dd-MM-yyyy")}`;
    }
    return "Select date range";
  };

  const handleSelect = (range) => {
    const newRange = range || { from: null, to: null };
    onDateRangeChange(newRange);
    
    // Close popover only when both dates are selected
    // If dates are the same, allow user to click again to confirm or select a different end date
    if (newRange?.from && newRange?.to) {
      // Only close if dates are different (valid range)
      // If same date, keep open so user can click again to confirm or select end date
      if (!isSameDay(newRange.from, newRange.to)) {
        setTimeout(() => setOpen(false), 100);
      }
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDateRangeChange({ from: null, to: null });
    setOpen(false);
  };

  const quickFilters = [
    {
      label: "Last 7 days",
      getRange: () => ({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date())
      })
    },
    {
      label: "Last 30 days",
      getRange: () => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date())
      })
    },
    {
      label: "This week",
      getRange: () => ({
        from: startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 })),
        to: endOfDay(endOfWeek(new Date(), { weekStartsOn: 1 }))
      })
    },
    {
      label: "This month",
      getRange: () => ({
        from: startOfDay(startOfMonth(new Date())),
        to: endOfDay(endOfMonth(new Date()))
      })
    },
    {
      label: "This year",
      getRange: () => ({
        from: startOfDay(startOfYear(new Date())),
        to: endOfDay(endOfYear(new Date()))
      })
    },
    {
      label: "All time",
      getRange: () => ({
        from: null,
        to: null
      })
    }
  ];

  const handleQuickFilter = (filter) => {
    const range = filter.getRange();
    onDateRangeChange(range);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full md:w-[280px]">
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal w-full relative", !dateRange && "text-muted-foreground", className)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="flex-1">{displayText()}</span>
            </Button>
            {dateRange && (from || to) && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10"
                onClick={handleClear}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label="Clear date range"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => {
          // Prevent closing when clicking on calendar dropdowns
          const target = e.target;
          if (target?.closest?.('.rdp-dropdown') || target?.closest?.('[role="combobox"]')) {
            e.preventDefault();
          }
        }}>
          <div className="p-3 border-b">
            {showQuickFilters && (
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickFilter(filter)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={new Date().getFullYear() + 1}
            initialFocus
            classNames={{
              range_start: "bg-[var(--accent-1)] text-white rounded-l-md font-semibold",
              range_end: "bg-[var(--accent-1)] text-white rounded-r-md font-semibold",
              range_middle: "bg-[var(--accent-1)]/30 text-[var(--accent-1)] font-medium",
              selected: "bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)] hover:text-white",
              day_range_start: "bg-[var(--accent-1)] text-white",
              day_range_end: "bg-[var(--accent-1)] text-white",
              day_range_middle: "bg-[var(--accent-1)]/30 text-[var(--accent-1)]",
            }}
            modifiersClassNames={{
              range_start: "bg-[var(--accent-1)] text-white",
              range_end: "bg-[var(--accent-1)] text-white",
              range_middle: "bg-[var(--accent-1)]/30 text-[var(--accent-1)]",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

