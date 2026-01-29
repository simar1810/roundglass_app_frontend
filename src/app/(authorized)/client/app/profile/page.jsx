"use client";
import ClientDataOwn from "@/components/client/profile/ClientDataOwn";
import ClientDetailsCardProfile from "@/components/client/profile/ClientDetailsCardProfile";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getClientProfile } from "@/lib/fetchers/app";
import { fetchData } from "@/lib/api";
import { useMemo } from "react";
import useSWR from "swr";

export default function Page() {
  const { isLoading, error, data } = useSWR("clientProfile", getClientProfile);
  const clientId = data?.data?._id;
  const { data: preferencesData } = useSWR(
    clientId ? `app/roundglass/client-preference?person=client&clientId=${clientId}` : null,
    () => fetchData(`app/roundglass/client-preference?person=client&clientId=${clientId}`)
  );

  if (isLoading) return <ContentLoader />
  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  
  // Merge preferences data into clientData using useMemo to ensure it updates when preferences change
  const clientData = useMemo(() => {
    const merged = { ...data.data };
    merged.weightLoss = data.weightLost;
    if (preferencesData?.status_code === 200 && preferencesData?.data) {
      merged.clientPreferences = preferencesData.data;
    }
    return merged;
  }, [data, preferencesData]);

  return <div className="mt-4 grid md:grid-cols-2 items-start gap-4">
    <ClientDetailsCardProfile clientData={clientData} />
    <ClientDataOwn clientData={clientData} />
  </div>
}