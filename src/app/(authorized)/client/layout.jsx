"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("userData");
    const userType = localStorage.getItem("userType");
    
    if (!user || userType !== "user") {
      router.push("/login");
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-1)] mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}