"use client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Responsive Chart Container Component
 * Ensures charts stack vertically on mobile and adjust height
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Chart content
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.mobileHeight - Height on mobile (default: 300)
 * @param {number} props.desktopHeight - Height on desktop (default: 400)
 */
export default function AnalyticsResponsiveChart({
  children,
  className = "",
  mobileHeight = 300,
  desktopHeight = 400,
}) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn("w-full", className)}
      style={{
        height: isMobile ? `${mobileHeight}px` : `${desktopHeight}px`,
        minHeight: isMobile ? `${mobileHeight}px` : `${desktopHeight}px`,
      }}
    >
      {children}
    </div>
  );
}

