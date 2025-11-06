"use client";

import { useRouter } from "next/navigation";

export default function Error502() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-4xl font-bold mb-4 leading-[1]">Website is Under Maintenance</h1>
        <p className="text-lg leading-[1] mb-4">
          Please reach out to customer support.
        </p>
        <button
          onClick={() => window.location.href = "/coach/dashboard"}
          className="px-4 py-2 bg-[var(--accent-1)] text-white rounded hover:bg-[var(--accent-1)] hover:opacity-80"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

