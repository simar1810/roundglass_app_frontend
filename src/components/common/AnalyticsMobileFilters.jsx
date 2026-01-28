"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile Filters Component
 * Provides a mobile-optimized filter drawer for analytics components
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Filter content to display in drawer
 * @param {string} props.title - Title for the filter drawer
 * @param {number} props.activeFilterCount - Number of active filters (for badge)
 * @param {Function} props.onClear - Optional clear all filters handler
 * @param {boolean} props.showClearButton - Show clear button (default: true)
 */
export default function AnalyticsMobileFilters({
  children,
  title = "Filters",
  activeFilterCount = 0,
  onClear,
  showClearButton = true,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            {showClearButton && onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="text-muted-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
          <SheetDescription>
            Adjust your filters to refine the analytics view
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

