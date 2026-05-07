"use client";

import { usePDF } from "@react-pdf/renderer";
import { useEffect } from "react";

/** Safe filename segment for `download=` (Windows + common FS rules). */
export function sanitizePdfDownloadBasename(name) {
  let s = String(name ?? "").trim();
  if (!s) return "document";
  s = s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
  if (!s) return "document";
  return s.slice(0, 180);
}

/**
 * Same rendering pipeline as @react-pdf/renderer's PDFViewer (blob + iframe),
 * plus a download link so the file saves as `fileNameBase.pdf` instead of a random blob id.
 */
export default function NamedPdfViewer({
  children,
  fileNameBase,
  showToolbar = true,
  className,
  style,
  title,
  innerRef,
  showDownloadBar = true,
  ...rest
}) {
  const [instance, updateInstance] = usePDF();

  useEffect(() => {
    updateInstance(children);
  }, [children, updateInstance]);

  const base = sanitizePdfDownloadBasename(fileNameBase ?? title);
  const src = instance.url ? `${instance.url}#toolbar=${showToolbar ? 1 : 0}` : null;
  const iframeTitle = title || base;

  return (
    <div className={`flex min-h-0 flex-col ${className || ""}`} style={style}>
      {showDownloadBar && instance.url ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border bg-muted/40 px-3 py-2">
          <a
            href={instance.url}
            download={`${base}.pdf`}
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground no-underline hover:opacity-90"
          >
            Download PDF
          </a>
        </div>
      ) : null}
      <iframe
        ref={innerRef}
        title={iframeTitle}
        src={src}
        className="min-h-0 w-full flex-1 border-0"
        {...rest}
      />
    </div>
  );
}
