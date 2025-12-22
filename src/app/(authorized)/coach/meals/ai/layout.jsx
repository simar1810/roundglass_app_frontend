"use client";

import { useAppSelector } from "@/providers/global/hooks";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function Layout({ children }) {
  const { features } = useAppSelector((state) => state.coach.data);
  if (!features.includes(8))
    return (
      <div className="content-container content-height-screen flex flex-col items-center justify-center h-full text-center">
        <Lock className="h-6 w-6 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 max-w-[60ch]">
          This feature is not available for your account. Please contact support
          for more information.&nbsp;
          <Link
            className="font-bold hover:underline hover:text-blue-600"
            target="_blank"
            href="https://wa.me/9876543210?text=Hi,%20I%E2%80%99m%20interested%20in%20upgrading%20my%20app.%20Could%20you%20please%20help%20me%20with%20the%20available%20options?"
          >
            9876543210
          </Link>
        </p>
      </div>
    );
  return children;
}
