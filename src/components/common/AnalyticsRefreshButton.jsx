"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Analytics Refresh Button Component
 * Provides consistent refresh functionality with loading state
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - Refresh callback function
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isValidating - Validating state (from SWR)
 * @param {string} props.variant - Button variant (default: "outline")
 * @param {string} props.size - Button size (default: "sm")
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showToast - Show toast notification on refresh (default: true)
 * @param {string} props.successMessage - Success message for toast
 */
export default function AnalyticsRefreshButton({
  onRefresh,
  isLoading = false,
  isValidating = false,
  variant = "outline",
  size = "sm",
  className = "",
  showToast = true,
  successMessage = "Data refreshed",
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
      if (showToast) {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isActive = isLoading || isValidating || isRefreshing;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isActive}
      className={cn("flex items-center gap-2", className)}
    >
      <RefreshCw
        className={cn(
          "h-4 w-4",
          isActive && "animate-spin"
        )}
      />
      Refresh
    </Button>
  );
}

