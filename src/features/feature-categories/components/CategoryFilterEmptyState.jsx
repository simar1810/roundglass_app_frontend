import { Button } from "@/components/ui/button";
import { getCategoryFilterEmptyMessage } from "@/features/feature-categories/utils/filter-helpers";

export default function CategoryFilterEmptyState({
  entityLabel = "items",
  hasSearch = false,
  hasCategoryFilters = false,
  onClear,
  className = "mt-10 rounded-lg border border-dashed border-border/80 bg-[var(--comp-1)]/30 px-6 py-12 text-center text-sm text-[var(--dark-1)]/60",
}) {
  return (
    <div className={className}>
      <p>
        {getCategoryFilterEmptyMessage({ entityLabel, hasSearch, hasCategoryFilters })}
      </p>
      {(hasSearch || hasCategoryFilters) && onClear && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          className="mt-4 border-[var(--accent-1)] text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
