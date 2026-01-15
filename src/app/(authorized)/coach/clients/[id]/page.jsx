"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import ClientData from "@/components/pages/coach/client/ClientData";
import ClientDetailsCard from "@/components/pages/coach/client/ClientDetailsCard";
import { getAppClientPortfolioDetails, getClientPreferences } from "@/lib/fetchers/app";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";

export default function Page() {
  const { id } = useParams();
  const { isLoading, error, data } = useSWR(`clientDetails/${id}`, () => getAppClientPortfolioDetails(id));
  const { data: preferencesData } = useSWR(
    `app/roundglass/client-preference?person=coach&clientId=${id}`,
    () => getClientPreferences(id)
  );

  // Merge preferences data into clientData using useMemo to ensure it updates when preferences change
  // This hook must be called before any conditional returns to follow Rules of Hooks
  const clientData = useMemo(() => {
    if (!data?.data) return null;
    const merged = { ...data.data };
    merged.weightLoss = data.weightLost;
    
    // Handle both success (200) and not found (200 with null data) responses
    if (preferencesData?.status_code === 200 && preferencesData?.data) {
      merged.clientPreferences = preferencesData.data;
      
      // Map new structure to old structure for backward compatibility
      // Training Info
      if (preferencesData.data.trainingModule && preferencesData.data.trainingModule.length > 0) {
        const firstTraining = preferencesData.data.trainingModule[0];
        merged.trainingInfo = {
          trainingFrequency: firstTraining.trainingFrequency,
          trainingDuration: firstTraining.duration,
          trainingIntensity: firstTraining.intensity,
          conditioningDays: firstTraining.conditioningDays,
        };
      }
      
      // Supplements
      if (preferencesData.data.supplements) {
        merged.supplementIntake = preferencesData.data.supplements;
      }
      
      // Injuries
      if (preferencesData.data.injuries) {
        merged.injuryLog = preferencesData.data.injuries.map(injury => ({
          ...injury,
          files: injury.fileUpload ? [injury.fileUpload] : [],
        }));
      }
    }
    
    return merged;
  }, [data, preferencesData]);

  if (isLoading) return <ContentLoader />
  if (error || data?.status_code !== 200) return <ContentError title={error?.message || data?.message} />
  if (!clientData) return <ContentLoader />

  return <div className="mt-4 grid md:grid-cols-2 items-start gap-4">
    <ClientDetailsCard clientData={clientData} />
    <ClientData clientData={clientData} />
  </div>
}