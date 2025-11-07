"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { getAppClients } from "@/lib/fetchers/app";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PiSparkleFill } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";

export default function Page() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const query = { page: 1, limit: 540 };

  const { isLoading, error, data } = useSWR(
    `getAppClients?page=${query.page}&limit=${query.limit}`,
    () => getAppClients(query)
  );

  const handleAiGeneration = async (clientId, mode) => {
    try {
      setIsGenerating(clientId);
      setDropdownOpen(null);
      toast.loading(`Generating ${mode} AI meal plan...`);

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

      const resData = await response.json();
      toast.dismiss();
      setIsGenerating(null);

      if (response.ok && resData.status_code === 200) {
        toast.success("AI Meal Plan generated successfully!");
        localStorage.setItem("aiMealPlan", JSON.stringify(resData.data));
        await new Promise((r) => setTimeout(r, 1000));
        router.push(`/coach/meals/add-custom/${mode}`);
      } else {
        throw new Error(resData.message || "Failed to generate AI plan");
      }
    } catch (err) {
      toast.dismiss();
      setIsGenerating(null);
      toast.error(err.message || "Something went wrong!");
      console.error("Error:", err);
    }
  };

  if (isLoading) return <ContentLoader />;
  if (error || data?.status_code !== 200)
    return <ContentError title={error || data?.message} />;

  const clients = data?.data || [];

  const filteredClients = clients.filter((client) => (
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) && client.isActive && client.isVerified && client.joiningDate
  ));
  return (
    <main className="content-container content-height-screen relative">
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm w-full">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-16 w-full sm:w-[450px] text-center animate-fade-in">
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/illustrations/support.svg"
                alt="Sorting Illustration"
                width={180}
                height={180}
                className="mx-auto mb-10"
              />
              <h2 className="text-xl font-normal text-gray-800">
                We are Sorting through more than{" "}
                <span className="text-green-600 font-bold">25,000+</span> Meals
                in our Database
              </h2>
              <p className="text-gray-400 text-xs mt-3 px-4">
                This may take some time, but hang on tight — we’re doing magic
                behind the curtains so that you don’t have to take the load.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 mb-6 sticky top-0 bg-white z-20 pb-2">
        <h4 className="text-2xl font-semibold">Clients Lists for Meal Plan</h4>

        <div className="relative w-64">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#67BC2A] transition-all"
          />
        </div>
      </div>

      <div
        className="overflow-y-auto no-scrollbar"
        style={{ maxHeight: "70vh" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {filteredClients.map((client) => (
            <div
              key={client._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 pb-8 flex items-start gap-4 hover:shadow-md transition-shadow relative"
            >
              <div className="w-16 h-16 flex-shrink-0">
                <Image
                  src={client.image || "/profile1.jpg"}
                  alt={client.name}
                  width={60}
                  height={60}
                  className="rounded-xl object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {client.name || "Unknown Client"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Last Meal Assigned on{" "}
                      {client.lastMealAssigned || "10-10-25"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 px-2 pl-4 py-2 rounded-md">
                    <PiSparkleFill size={14} className="text-[#67BC2A]" />
                    <p className="text-[10px] text-[#67BC2A] font-medium ">
                      {client.creditsLeft || 3} Credits Left
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 relative">
                  <Button
                    className="bg-white text-[#67BC2A] border border-green-200 hover:bg-[#67BC2A] hover:text-white text-xs px-3 py-1 rounded-md"
                    onClick={() =>
                      router.push(`/coach/meals/list-custom`)
                    }
                  >
                    View Current Meal Plan
                  </Button>
                  <div className="relative">
                    <Button
                      onClick={() =>
                        setDropdownOpen(
                          dropdownOpen === client._id ? null : client._id
                        )
                      }
                      disabled={isGenerating === client._id}
                      className={`text-xs px-3 py-1 rounded-md ${
                        isGenerating === client._id
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-[#67BC2A] text-white hover:bg-green-600"
                      }`}
                    >
                      {isGenerating === client._id
                        ? "Generating..."
                        : "Create AI Meal Plan"}
                    </Button>
                    {dropdownOpen === client._id && (
                      <div className="absolute top-10 right-0 bg-green-50 border border-gray-200 shadow-md rounded-md w-32 z-10">
                        <button
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-white"
                          onClick={() => handleAiGeneration(client._id, "daily")}
                        >
                          Daily
                        </button>
                        <button
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-white"
                          onClick={() =>
                            handleAiGeneration(client._id, "weekly")
                          }
                        >
                          Weekly
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <p className="text-gray-500 text-center col-span-full">
              No clients found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
