"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
// import Cookies from "js-cookie";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { getAppClients } from "@/lib/fetchers/app";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(null); 

  const query = { page: 1, limit: 540 };
  const { isLoading, error, data } = useSWR(
    `getAppClients?page=${query.page}&limit=${query.limit}`,
    () => getAppClients(query)
  );
  const mode = pathname.split("/").pop();

  const handleAiGeneration = async (clientId) => {
    try {
      setIsGenerating(clientId);
      toast.loading("Generating AI meal plan...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/app/meal-plan/ai/generate?clientId=${clientId}&mode=${mode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      toast.dismiss();
      setIsGenerating(null);

      if (response.ok && data.status_code === 200) {
        toast.success("AI Meal Plan generated successfully!");
        localStorage.setItem("aiMealPlan", JSON.stringify(data.data));

        await new Promise((r) => setTimeout(r, 1000));

        router.push(`/coach/meals/add-custom/${mode}`);
      } else {
        throw new Error(data.message || "Failed to generate AI plan");
      }
    } catch (error) {
      toast.dismiss();
      setIsGenerating(null);
      toast.error(error.message || "Something went wrong!");
      console.error("error", error);
    }
  };

  if (isLoading) return <ContentLoader />;
  if (error || data?.status_code !== 200)
    return <ContentError title={error || data?.message} />;
  const clients = data?.data;
  return (
    <main className="content-container content-height-screen">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-semibold">AI Meal Plan Generator</h4>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {clients.map((client) => (
          <div
            key={client._id}
            className="border border-gray-200 rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">{client.name}</p>
            </div>

            <Button
              onClick={() => handleAiGeneration(client._id)}
              disabled={isGenerating === client._id}
              className={`px-3 py-1 text-sm rounded-lg ${
                isGenerating === client._id
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[var(--accent-1)] text-white"
              }`}
            >
              {isGenerating === client._id ? "Generating..." : "Generate"}
            </Button>
          </div>
        ))}

        {clients.length === 0 && (
          <p className="text-gray-500 col-span-2 text-center">
            No clients found.
          </p>
        )}
      </div>
    </main>
  );
}
