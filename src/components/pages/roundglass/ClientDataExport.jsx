"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoundglassDataExport } from "@/hooks/useRoundglassDataExport";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, FileSpreadsheet, FileText, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client Data Export Component
 * Provides export functionality for individual client data
 * 
 * @param {Object} props
 * @param {string} props.clientId - Client ID (MongoDB ObjectId) - required
 * @param {string} [props.defaultFormat] - Default export format: 'csv' or 'excel' (default: 'excel')
 * @param {string} [props.filename] - Optional custom filename (without extension)
 * @param {string} [props.variant] - Button variant (default: 'outline')
 * @param {string} [props.size] - Button size (default: 'sm')
 * @param {boolean} [props.showFormatDropdown] - Show format dropdown menu (default: true)
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Custom trigger element (optional)
 */
export default function ClientDataExport({
  clientId,
  defaultFormat = "excel",
  filename = null,
  variant = "outline",
  size = "sm",
  showFormatDropdown = true,
  className,
  children,
}) {
  const { isExporting, exportProgress, exportError, exportClient, clearError } = useRoundglassDataExport();
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);

  // Clear error when component mounts or clientId changes
  useEffect(() => {
    if (exportError) {
      clearError();
    }
  }, [clientId, exportError, clearError]);

  const handleExport = async (format = selectedFormat) => {
    if (!clientId) {
      return;
    }
    await exportClient(clientId, format, filename);
  };

  // If no format dropdown, just show a simple button
  if (!showFormatDropdown) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={() => handleExport()}
          disabled={isExporting || !clientId}
          className={cn("gap-2", className)}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Exporting... {exportProgress}%</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </>
          )}
        </Button>
        {isExporting && (
          <div className="w-full">
            <Progress value={exportProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {exportProgress < 50
                ? "Fetching data..."
                : exportProgress < 90
                ? "Preparing file..."
                : "Finalizing..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // With format dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button
            variant={variant}
            size={size}
            disabled={isExporting || !clientId}
            className={cn("gap-2", className)}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting... {exportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {isExporting ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting... {exportProgress}%
            </DropdownMenuLabel>
            <div className="px-2 py-2">
              <Progress value={exportProgress} className="h-1.5 mb-2" />
              <p className="text-xs text-muted-foreground">
                {exportProgress < 50
                  ? "Fetching data from server..."
                  : exportProgress < 90
                  ? "Preparing export file..."
                  : "Finalizing export..."}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>Export as Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
              <FileText className="h-4 w-4 mr-2" />
              <span>Export as CSV</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Export Format</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Learn about export formats"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold mb-1">Excel (.xlsx):</p>
                      <p className="ml-2">Single file with multiple sheets (All Data, Client Info). Best for analysis.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">CSV (.csv):</p>
                      <p className="ml-2">Simple text format. Includes all client data, preferences, training modules, supplements, injuries, and diet recall.</p>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1 border-t">
                      <strong>Includes:</strong> Client info, preferences, training modules, supplements, injuries, diet recall
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedFormat("excel");
                handleExport("excel");
              }}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>Export as Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedFormat("csv");
                handleExport("csv");
              }}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span>Export as CSV</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

