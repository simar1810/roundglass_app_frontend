"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasActiveCategoryFilters } from "@/features/feature-categories/utils/filter-helpers";
import { cn } from "@/lib/utils";

function optionKey(option) {
  return typeof option === "string" ? option : option._id;
}

function optionValue(option) {
  return typeof option === "string" ? option : option.name;
}

function optionLabel(option) {
  return typeof option === "string" ? option : option.name;
}

export default function CategorySubcategoryFilters({
  category,
  subCategory,
  onCategoryChange,
  onSubCategoryChange,
  mainCategories = [],
  subCategories = [],
  className,
  triggerClassName,
  showClear = true,
}) {
  const active = hasActiveCategoryFilters(category, subCategory);

  function handleCategoryChange(value) {
    onCategoryChange(value);
    onSubCategoryChange("all");
  }

  function clearFilters() {
    onCategoryChange("all");
    onSubCategoryChange("all");
  }

  const triggerClasses = cn(
    "h-9 w-full min-w-[9rem] sm:w-[11rem] shrink-0 text-xs sm:text-sm",
    active && "border-[var(--accent-1)]/50 bg-[var(--accent-1)]/5",
    triggerClassName,
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={category} onValueChange={handleCategoryChange}>
        <SelectTrigger aria-label="Filter by category" className={triggerClasses}>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {mainCategories.map((cat) => (
            <SelectItem key={optionKey(cat)} value={optionValue(cat)} className="capitalize">
              {optionLabel(cat)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={subCategory} onValueChange={onSubCategoryChange}>
        <SelectTrigger aria-label="Filter by subcategory" className={triggerClasses}>
          <SelectValue placeholder="Subcategory" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All subcategories</SelectItem>
          {subCategories.map((cat) => (
            <SelectItem key={optionKey(cat)} value={optionValue(cat)} className="capitalize">
              {optionLabel(cat)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showClear && active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 shrink-0 px-2 text-xs font-semibold text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
