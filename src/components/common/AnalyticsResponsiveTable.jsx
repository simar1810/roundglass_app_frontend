"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Responsive Table Wrapper Component
 * Provides mobile-optimized table with horizontal scroll
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Table content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.stickyHeader - Make header sticky on scroll (default: true)
 */
export default function AnalyticsResponsiveTable({
  children,
  className = "",
  stickyHeader = true,
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto -mx-4 sm:mx-0",
        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        className
      )}
    >
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        <Table className="min-w-full">
          {stickyHeader && (
            <style jsx>{`
              @media (max-width: 768px) {
                thead {
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  background: white;
                }
              }
            `}</style>
          )}
          {children}
        </Table>
      </div>
    </div>
  );
}

