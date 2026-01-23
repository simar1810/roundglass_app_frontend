"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw, Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty State Component for Analytics
 * @param {Object} props
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {React.ReactNode} props.icon - Optional icon component
 * @param {Array} props.actions - Array of action buttons { label, onClick, variant }
 * @param {string} props.className - Additional CSS classes
 */
export default function AnalyticsEmptyState({
  title = "No data available",
  description = "There is no data to display at this time.",
  icon,
  actions = [],
  className = "",
}) {
  const defaultIcon = icon || <BarChart3 className="h-12 w-12 text-muted-foreground" />;

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="mb-4">{defaultIcon}</div>
        <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>
        {actions.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.onClick}
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state for filtered results
 */
export function FilteredEmptyState({ onClearFilters, className = "" }) {
  return (
    <AnalyticsEmptyState
      title="No results found"
      description="No data matches your current filters. Try adjusting your filters to see more results."
      icon={<Filter className="h-12 w-12 text-muted-foreground" />}
      actions={[
        {
          label: "Clear Filters",
          onClick: onClearFilters,
          variant: "outline",
          icon: <RefreshCw className="h-4 w-4" />,
        },
      ]}
      className={className}
    />
  );
}

/**
 * Empty state for no data available
 */
export function NoDataEmptyState({ onRefresh, className = "" }) {
  return (
    <AnalyticsEmptyState
      title="No data available"
      description="There is no analytics data available at this time. Data will appear here once it's collected."
      icon={<BarChart3 className="h-12 w-12 text-muted-foreground" />}
      actions={
        onRefresh
          ? [
              {
                label: "Refresh",
                onClick: onRefresh,
                variant: "default",
                icon: <RefreshCw className="h-4 w-4" />,
              },
            ]
          : []
      }
      className={className}
    />
  );
}

/**
 * Empty state for error recovery
 */
export function ErrorEmptyState({ onRetry, errorMessage, className = "" }) {
  return (
    <AnalyticsEmptyState
      title="Unable to load data"
      description={errorMessage || "An error occurred while loading the data. Please try again."}
      icon={<RefreshCw className="h-12 w-12 text-destructive" />}
      actions={
        onRetry
          ? [
              {
                label: "Try Again",
                onClick: onRetry,
                variant: "default",
                icon: <RefreshCw className="h-4 w-4" />,
              },
            ]
          : []
      }
      className={className}
    />
  );
}

