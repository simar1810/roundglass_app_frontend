"use client";
import { useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Dumbbell, Pill, AlertTriangle, Utensils, Activity } from "lucide-react";
import UpdateClientDetailsModal from "@/components/modals/client/UpdateClientDetailsModal";
import UpdateClientTrainingInfoModal from "@/components/modals/client/UpdateClientTrainingInfoModal";
import UpdateClientSupplementIntakeModal from "@/components/modals/client/UpdateClientSupplementIntakeModal";
import UpdateClientInjuryLogModal from "@/components/modals/client/UpdateClientInjuryLogModal";
import UpdateClientMealRecallModal from "@/components/modals/client/UpdateClientMealRecallModal";
import { clientPortfolioFields } from "@/config/data/ui";
import { generateWeightStandard } from "@/lib/client/statistics";
import { extractNumber } from "@/lib/utils";
import { isBefore, parse } from "date-fns";
import Image from "next/image";
import { Trash2, Eye } from "lucide-react";
import { sendData } from "@/lib/api";
import { toast } from "sonner";
import { mutate } from "swr";
import InjuryAnalyticsDashboard from "./InjuryAnalyticsDashboard";
import MealRecallDisplay from "./MealRecallDisplay";

function getClientHeightStr(healthMatrix) {
  if (["cm", "cms"].includes(healthMatrix.heightUnit?.toLowerCase()))
    return `${healthMatrix?.height} ${healthMatrix?.heightUnit}`;
  const [feet, inches] = healthMatrix?.height?.split(".");
  return `${feet} Ft ${inches} In`;
}

function findClientLatestWeight(matrices = []) {
  const latestWeightMatrix = matrices
    .map((matrix) => ({
      ...matrix,
      date: parse(matrix.createdDate, "dd-MM-yyyy", new Date()),
    }))
    .sort((dateA, dateB) =>
      isBefore(new Date(dateB.date), new Date(dateA.date)) ? -1 : 1,
    )
    ?.at(0);
  return `${extractNumber(latestWeightMatrix?.weight)} ${latestWeightMatrix?.weightUnit}`;
}

export default function ClientModulesDrawer({ clientData }) {
  return (
    <Drawer direction="right">
      <DrawerTrigger
        aria-label="Open client modules"
        className="fixed right-0 top-1/2 z-30 -translate-y-1/2 md:translate-x-[-24px] rounded-l-full bg-[var(--primary-1)] px-4 py-2 font-semibold text-[var(--accent-1)] shadow-lg transition hover:translate-x-[-16px]"
      >
        <div className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Modules
        </div>
      </DrawerTrigger>
      <DrawerContent className="w-full min-w-[100vw] md:min-w-[90vw] !max-w-[90vw] overflow-hidden p-0">
        <DialogTitle />
        <div className="relative flex h-full flex-col bg-[#f6f8fb]">
          <ClientModulesContent clientData={clientData} />
          <DrawerClose
            aria-label="Close client modules"
            className="absolute left-0 top-1/2 -translate-x-[36px] -translate-y-1/2 rounded-full bg-[var(--primary-1)] p-2 text-white shadow-lg transition hover:bg-[var(--accent-1)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ClientModulesContent({ clientData }) {
  const [activeTab, setActiveTab] = useState("personal-info");

  const clienthealthMatrix = clientData?.healthMatrix?.healthMatrix || [{}];
  const latestWeight = findClientLatestWeight(clienthealthMatrix);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center gap-4">
          <DrawerClose>
            <ChevronLeft className="h-5 w-5" />
          </DrawerClose>
          <h2 className="text-lg md:text-3xl font-semibold text-slate-900">Client Modules</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto md:px-8 pb-12 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap justify-center md:justify-start h-auto items-center gap-2 md:gap-6 border-b border-slate-200 bg-transparent px-2 md:p-0 w-[100vw] md:w-auto mb-6">
            <TabsTrigger
              value="personal-info"
              className="relative flex-none rounded-none border-0 bg-transparent px-0 p-2 md:pb-3 text-sm md:text-base font-semibold text-slate-500 h-auto data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:rounded-full data-[state=active]:after:bg-[var(--accent-1)]"
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger
              value="training-info"
              className="relative flex-none rounded-none border-0 bg-transparent px-0 p-2 md:pb-3 text-sm md:text-base font-semibold text-slate-500 h-auto data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:rounded-full data-[state=active]:after:bg-[var(--accent-1)]"
            >
              <Dumbbell className="w-4 h-4 mr-2 inline" />
              Training
            </TabsTrigger>
            <TabsTrigger
              value="supplement-intake"
              className="relative flex-none rounded-none border-0 bg-transparent px-0 p-2 md:pb-3 text-sm md:text-base font-semibold text-slate-500 h-auto data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:rounded-full data-[state=active]:after:bg-[var(--accent-1)]"
            >
              <Pill className="w-4 h-4 mr-2 inline" />
              Supplements
            </TabsTrigger>
            <TabsTrigger
              value="injury-log"
              className="relative flex-none rounded-none border-0 bg-transparent px-0 p-2 md:pb-3 text-sm md:text-base font-semibold text-slate-500 h-auto data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:rounded-full data-[state=active]:after:bg-[var(--accent-1)]"
            >
              <AlertTriangle className="w-4 h-4 mr-2 inline" />
              Injury Log
            </TabsTrigger>
            <TabsTrigger
              value="meal-recall"
              className="relative flex-none rounded-none border-0 bg-transparent px-0 p-2 md:pb-3 text-sm md:text-base font-semibold text-slate-500 h-auto data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:rounded-full data-[state=active]:after:bg-[var(--accent-1)]"
            >
              <Utensils className="w-4 h-4 mr-2 inline" />
              Meal Recall
            </TabsTrigger>
            <TabsTrigger
              value="injury-analytics"
              className="relative flex-none rounded-none border-0 bg-transparent px-0 p-2 md:pb-3 text-sm md:text-base font-semibold text-slate-500 h-auto data-[state=active]:text-slate-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-[3px] data-[state=active]:after:w-full data-[state=active]:after:rounded-full data-[state=active]:after:bg-[var(--accent-1)]"
            >
              <Activity className="w-4 h-4 mr-2 inline" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal-info" className="mt-6">
            <PersonalInfoTab clientData={clientData} latestWeight={latestWeight} />
          </TabsContent>

          <TabsContent value="training-info" className="mt-6">
            <TrainingInfoTab clientData={clientData} />
          </TabsContent>

          <TabsContent value="supplement-intake" className="mt-6">
            <SupplementIntakeTab clientData={clientData} />
          </TabsContent>

          <TabsContent value="injury-log" className="mt-6">
            <InjuryLogTab clientData={clientData} />
          </TabsContent>

          <TabsContent value="meal-recall" className="mt-6">
            <MealRecallTab clientData={clientData} />
          </TabsContent>

          <TabsContent value="injury-analytics" className="mt-6">
            <InjuryAnalyticsTab clientData={clientData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PersonalInfoTab({ clientData, latestWeight }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
        <UpdateClientDetailsModal clientData={clientData} />
      </div>
      <div className="space-y-3">
        {clientPortfolioFields.map((field) => (
          <div
            key={field.id}
            className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3"
          >
            <p className="font-medium">{field.title}</p>
            <p className="text-[var(--dark-2)]">
              {clientData[field.name] || "-"}
            </p>
          </div>
        ))}
        {clientData?.healthMatrix?.height && (
          <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
            <p className="font-medium">Height</p>
            <p className="text-[var(--dark-2)]">
              {getClientHeightStr(clientData.healthMatrix)}
            </p>
          </div>
        )}
        {latestWeight && (
          <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
            <p className="font-medium">Latest Weight</p>
            <p className="text-[var(--dark-2)]">{latestWeight}</p>
          </div>
        )}
        
        {/* Health Information Fields */}
        {(() => {
          const allergies = clientData?.clientPreferences?.allergies || "";
          const medicalHistory = clientData?.clientPreferences?.medicalHistory || "";
          const familyHistory = clientData?.clientPreferences?.familyHistory || "";
          
          return (
            <>
              {allergies && (
                <div className="text-[13px] grid grid-cols-[120px_1fr] gap-3">
                  <p className="font-medium">Allergies, dietary restrictions</p>
                  <p className="text-[var(--dark-2)] break-words whitespace-pre-wrap">
                    {allergies}
                  </p>
                </div>
              )}
              {medicalHistory && (
                <div className="text-[13px] grid grid-cols-[120px_1fr] gap-3">
                  <p className="font-medium">Medical history</p>
                  <p className="text-[var(--dark-2)] break-words whitespace-pre-wrap">
                    {medicalHistory}
                  </p>
                </div>
              )}
              {familyHistory && (
                <div className="text-[13px] grid grid-cols-[120px_1fr] gap-3">
                  <p className="font-medium">Family history</p>
                  <p className="text-[var(--dark-2)] break-words whitespace-pre-wrap">
                    {familyHistory}
                  </p>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

function TrainingInfoTab({ clientData }) {
  async function deleteTrainingEntry(index, entryId) {
    try {
      const trainingModules = clientData?.clientPreferences?.trainingModule || 
        (clientData?.trainingInfo ? [clientData.trainingInfo] : []);
      const updatedModules = trainingModules.filter((_, i) => i !== index);
      
      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: clientData._id,
          trainingModule: updatedModules,
        },
        "PUT"
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Training entry deleted successfully");
      mutate(`clientDetails/${clientData._id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${clientData._id}`, undefined, { revalidate: true });
    } catch (error) {
      toast.error(error.message || "Failed to delete training entry");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Training Information</h3>
        <UpdateClientTrainingInfoModal 
          id={clientData._id} 
          clientData={clientData}
        />
      </div>
      <div className="space-y-3">
        {(() => {
          const trainingModules = clientData?.clientPreferences?.trainingModule || 
            (clientData?.trainingInfo ? [clientData.trainingInfo] : []);
          
          return trainingModules.length > 0 ? (
            trainingModules.map((module, index) => (
              <div
                key={index}
                className="p-4 border-1 rounded-lg bg-[var(--comp-1)] space-y-2 relative"
              >
                {trainingModules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteTrainingEntry(index, module._id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {module.trainingFrequency && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-medium">Training Frequency</p>
                    <p className="text-[var(--dark-2)]">{module.trainingFrequency}</p>
                  </div>
                )}
                {module.duration && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-medium">Duration</p>
                    <p className="text-[var(--dark-2)]">{module.duration}</p>
                  </div>
                )}
                {module.intensity && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-medium">Intensity</p>
                    <p className="text-[var(--dark-2)]">{module.intensity}</p>
                  </div>
                )}
                {module.conditioningDays && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-medium">Conditioning Days</p>
                    <p className="text-[var(--dark-2)]">{module.conditioningDays}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm italic text-[#808080]">
              No training information added yet
            </p>
          );
        })()}
      </div>
    </div>
  );
}

function SupplementIntakeTab({ clientData }) {
  async function deleteSupplementEntry(index, entryId) {
    try {
      const supplements = clientData?.clientPreferences?.supplements || clientData?.supplementIntake || [];
      const updatedSupplements = supplements.filter((_, i) => i !== index);
      
      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: clientData._id,
          supplements: updatedSupplements,
        },
        "PUT"
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Supplement entry deleted successfully");
      mutate(`clientDetails/${clientData._id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${clientData._id}`, undefined, { revalidate: true });
    } catch (error) {
      toast.error(error.message || "Failed to delete supplement entry");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Supplement Intake Tracker</h3>
        <UpdateClientSupplementIntakeModal 
          id={clientData._id} 
          clientData={clientData}
        />
      </div>
      <div className="space-y-3">
        {(() => {
          const supplements = clientData?.clientPreferences?.supplements || clientData?.supplementIntake || [];
          
          return supplements.length > 0 ? (
            supplements.map((supplement, index) => (
              <div
                key={supplement._id || index}
                className="p-4 border-1 rounded-lg bg-[var(--comp-1)] space-y-2 relative"
              >
                {supplements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteSupplementEntry(index, supplement._id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {supplement.brand && (
                  <div className="text-[13px] grid grid-cols-[100px_1fr] items-center gap-3">
                    <p className="font-semibold">Brand</p>
                    <p className="text-[var(--dark-2)]">{supplement.brand}</p>
                  </div>
                )}
                {supplement.dosage && (
                  <div className="text-[13px] grid grid-cols-[100px_1fr] items-center gap-3">
                    <p className="font-semibold">Dosage</p>
                    <p className="text-[var(--dark-2)]">{supplement.dosage}</p>
                  </div>
                )}
                {supplement.frequency && (
                  <div className="text-[13px] grid grid-cols-[100px_1fr] items-center gap-3">
                    <p className="font-semibold">Frequency</p>
                    <p className="text-[var(--dark-2)]">{supplement.frequency}</p>
                  </div>
                )}
                {supplement.source && (
                  <div className="text-[13px] grid grid-cols-[100px_1fr] items-center gap-3">
                    <p className="font-semibold">Source</p>
                    <p className="text-[var(--dark-2)]">{supplement.source}</p>
                  </div>
                )}
                {supplement.purpose && (
                  <div className="text-[13px] grid grid-cols-[100px_1fr] items-center gap-3">
                    <p className="font-semibold">Purpose</p>
                    <p className="text-[var(--dark-2)]">{supplement.purpose}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm italic text-[#808080]">
              No supplement information added yet
            </p>
          );
        })()}
      </div>
    </div>
  );
}

function InjuryLogTab({ clientData }) {
  async function deleteInjuryEntry(index, entryId) {
    try {
      const injuries = clientData?.clientPreferences?.injuries || clientData?.injuryLog || [];
      const updatedInjuries = injuries.filter((_, i) => i !== index);
      
      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: clientData._id,
          injuries: updatedInjuries,
        },
        "PUT"
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Injury entry deleted successfully");
      mutate(`clientDetails/${clientData._id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${clientData._id}`, undefined, { revalidate: true });
    } catch (error) {
      toast.error(error.message || "Failed to delete injury entry");
    }
  }

  function ImagePreviewDialog({ imageUrl, children }) {
    const [open, setOpen] = useState(false);
    const { Dialog, DialogContent, DialogTitle, DialogTrigger } = require("@/components/ui/dialog");

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] md:max-w-4xl max-h-[80vh] overflow-auto">
          <DialogTitle>Image Preview</DialogTitle>
          <div className="relative w-full h-[70vh] flex items-center justify-center">
            <Image
              src={imageUrl}
              alt="Image preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Injury Log</h3>
        <UpdateClientInjuryLogModal 
          id={clientData._id} 
          clientData={clientData}
        />
      </div>
      <div className="space-y-3">
        {(() => {
          const injuries = clientData?.clientPreferences?.injuries || clientData?.injuryLog || [];
          
          return injuries.length > 0 ? (
            injuries.map((injury, index) => (
              <div
                key={injury._id || index}
                className="p-4 border-1 rounded-lg bg-[var(--comp-1)] space-y-2 relative"
              >
                {injuries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteInjuryEntry(index, injury._id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {injury.injuryType && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-semibold">Injury Type</p>
                    <p className="text-[var(--dark-2)]">{injury.injuryType}</p>
                  </div>
                )}
                {injury.bodyPart && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-semibold">Body Part</p>
                    <p className="text-[var(--dark-2)]">{injury.bodyPart}</p>
                  </div>
                )}
                {injury.incidentDate && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-semibold">Incident Date</p>
                    <p className="text-[var(--dark-2)]">
                      {new Date(injury.incidentDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {injury.rehabProgress && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-start gap-3">
                    <p className="font-semibold">Rehab Progress</p>
                    <p className="text-[var(--dark-2)]">{injury.rehabProgress}</p>
                  </div>
                )}
                {injury.physiotherapistAssignment && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3">
                    <p className="font-semibold">Physiotherapist</p>
                    <p className="text-[var(--dark-2)]">
                      {injury.physiotherapistAssignment}
                    </p>
                  </div>
                )}
                {injury.fileUpload && (
                  <div className="text-[13px] grid grid-cols-[120px_1fr] items-start gap-3">
                    <p className="font-semibold">File</p>
                    <div className="text-[var(--dark-2)]">
                      {injury.fileUpload.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <ImagePreviewDialog imageUrl={injury.fileUpload}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Image
                          </Button>
                        </ImagePreviewDialog>
                      ) : (
                        <a
                          href={injury.fileUpload}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline break-all"
                        >
                          {injury.fileUpload}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm italic text-[#808080]">
              No injury log entries added yet
            </p>
          );
        })()}
      </div>
    </div>
  );
}

function MealRecallTab({ clientData }) {
  async function deleteMealRecallEntry(index, entryId) {
    try {
      const dietRecall = clientData?.clientPreferences?.dietRecall || [];
      const updatedDietRecall = dietRecall.filter((_, i) => i !== index);
      
      const response = await sendData(
        `app/roundglass/client-preference?person=coach`,
        {
          clientId: clientData._id,
          dietRecall: updatedDietRecall,
        },
        "PUT"
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Meal recall entry deleted successfully");
      mutate(`clientDetails/${clientData._id}`, undefined, { revalidate: true });
      mutate(`app/roundglass/client-preference?person=coach&clientId=${clientData._id}`, undefined, { revalidate: true });
    } catch (error) {
      toast.error(error.message || "Failed to delete meal recall entry");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">24-Hour Meal Recall</h3>
        <UpdateClientMealRecallModal 
          id={clientData._id} 
          clientData={clientData}
        />
      </div>
      <MealRecallDisplay 
        dietRecall={clientData?.clientPreferences?.dietRecall || []}
        onDelete={deleteMealRecallEntry}
      />
    </div>
  );
}

function InjuryAnalyticsTab({ clientData }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Injury Analytics Dashboard</h3>
      </div>
      <InjuryAnalyticsDashboard 
        clientData={clientData} 
        clientId={clientData._id}
      />
    </div>
  );
}

