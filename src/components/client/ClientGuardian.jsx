"use client"
import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import { getClientProfile } from "@/lib/fetchers/app";
import { useAppDispatch, useAppSelector } from "@/providers/global/hooks";
import { destroyClient, storeClient } from "@/providers/global/slices/client";
import { AlertCircle, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

export default function ClientGuardian({ children }) {
  const { isLoading, data } = useSWR("clientProfile", getClientProfile)
  const { cache } = useSWRConfig();

  const dispatchRedux = useAppDispatch();
  const client = useAppSelector(state => state.client.data);

  useEffect(function () {
    (async function () {
      if (data && data.status_code === 200) {
        dispatchRedux(storeClient(data.data))
      } else if (data?.status_code === 401) {
        dispatchRedux(destroyClient());
        await fetch("/api/logout", { method: "DELETE" });
        window.location.href = "/client/login";
      };
    }
    )();
  }, [isLoading]);

  if (data?.status_code === 401) {
    for (const [field] of cache.entries()) {
      if (field !== "clientProfile") cache.delete(field)
    }
    return <></>
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">
    <Loader />
  </div>

  if (data?.status_code !== 200 || !client) return <div className="h-screen text-[var(--accent-2)] flex flex-col gap-0 items-center justify-center font-bold text-[32px]">
    <TriangleAlert className="w-[64px] h-[64px]" />
    <ContentError
      className="min-h-auto border-0 mt-0 p-0"
      title={data?.message || "Please Wait"}
    />
  </div>

  // Check if client is inactive
  if (client && client.isActive === false) {
    return <InactiveClientModal />
  }

  return children;
}

function InactiveClientModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg border shadow-lg max-w-[450px] w-full mx-4 p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-[var(--accent-2)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--accent-2)] mb-4">
            Account Inactive
          </h2>
          <div className="py-4">
            <p className="text-[var(--dark-1)] text-base mb-2">
              You are currently inactive.
            </p>
            <p className="text-[var(--dark-2)] text-sm">
              Please contact your coach to reactivate your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}