"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Analytics Print Button Component
 * Provides print functionality for analytics pages
 * 
 * @param {Object} props
 * @param {Function} props.onPrint - Optional custom print handler
 * @param {string} props.variant - Button variant (default: "outline")
 * @param {string} props.size - Button size (default: "sm")
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.title - Optional title to add to print
 */
export default function AnalyticsPrintButton({
  onPrint,
  variant = "outline",
  size = "sm",
  className = "",
  title = null,
}) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    // Add print header if title is provided
    if (title) {
      const printHeader = document.createElement("div");
      printHeader.className = "print-header";
      printHeader.innerHTML = `
        <h1>${title}</h1>
        <div class="print-date">Generated on ${new Date().toLocaleString()}</div>
      `;
      
      // Insert at the beginning of content-container
      const container = document.querySelector(".content-container");
      if (container) {
        container.insertBefore(printHeader, container.firstChild);
      }

      // Remove header after printing
      window.addEventListener("afterprint", () => {
        printHeader.remove();
      });
    }

    // Trigger print
    window.print();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={cn("flex items-center gap-2 no-print", className)}
    >
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}

