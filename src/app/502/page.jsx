"use client";

import { useRouter } from "next/navigation";

export default function Error502() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-4xl font-bold mb-4 leading-[1]">502 - Bad Gateway</h1>
        <p className="text-lg leading-[1] mb-4">
          Sorry, the server is temporarily unavailable. Please try again later.
        </p>
        <button
          onClick={() => window.location.href = "/coach/dashboard"}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

