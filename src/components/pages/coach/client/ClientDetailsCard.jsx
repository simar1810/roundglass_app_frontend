import DeleteClientModal from "@/components/modals/client/DeleteClientModal";
import EditClientRollnoModal from "@/components/modals/client/EditClientRollnoModal";
import FollowUpModal from "@/components/modals/client/FollowUpModal";
import UpdateClientDetailsModal from "@/components/modals/client/UpdateClientDetailsModal";
import UpdateClientGoalModal from "@/components/modals/client/UpdateClientGoalModal";
import UpdateClientInjuryLogModal from "@/components/modals/client/UpdateClientInjuryLogModal";
import UpdateClientNotesModal from "@/components/modals/client/UpdateClientNotesModal";
import UpdateClientSupplementIntakeModal from "@/components/modals/client/UpdateClientSupplementIntakeModal";
import UpdateClientTrainingInfoModal from "@/components/modals/client/UpdateClientTrainingInfoModal";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { notesColors } from "@/config/data/other-tools";
import { clientPortfolioFields } from "@/config/data/ui";
import useClickOutside from "@/hooks/useClickOutside";
import { sendData } from "@/lib/api";
import { generateWeightStandard } from "@/lib/client/statistics";
import { nameInitials } from "@/lib/formatter";
import { permit } from "@/lib/permit";
import { extractNumber } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { isBefore, parse } from "date-fns";
import { ChevronDown, Copy, EllipsisVertical, Eye, Pen, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import InjuryAnalyticsDashboard from "./InjuryAnalyticsDashboard";
import ClientUpdateCategories from "./ClientUpdateCategories";

function getClientHeightStr(healthMatrix) {
  if (["cm", "cms"].includes(healthMatrix.heightUnit?.toLowerCase()))
    return `${healthMatrix?.height} ${healthMatrix?.heightUnit}`;
  const [feet, inches] = healthMatrix?.height?.split(".");
  return `${feet} Ft ${inches} In`;
}

export default function ClientDetailsCard({ clientData }) {
  return (
    <div>
      <ClientDetails clientData={clientData} />
    </div>
  );
}

function findClientLatestWeight(matrices = []) {
  const lastIndex = findClientLatestWeight.length - 1;
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

function ClientDetails({ clientData }) {
  const { activity_doc_ref: activities } = clientData;
  const [accordionValue, setAccordionValue] = useState(["personal-info", "training-info", "supplement-intake", "injury-log"]);
  
  async function sendAnalysis() {
    try {
      const response = await sendData(
        `app/requestFollowUpRequest?clientId=${clientData?.clientId}`,
      );
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    }
  }

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
  const clienthealthMatrix = clientData?.healthMatrix?.healthMatrix || [{}];
  const healthMatricesLength = clienthealthMatrix.length
    ? false
    : (
      generateWeightStandard(clienthealthMatrix?.at(0)) -
      generateWeightStandard(clienthealthMatrix?.at(healthMatricesLength - 1))
    ).toFixed(2);

  const latestWeight = findClientLatestWeight(clienthealthMatrix);

  return (
    <Card className="bg-white rounded-[18px] shadow-none w-[90vw] md:w-auto">
      <Header clientData={clientData} />
      <CardContent className="space-y-6">
        {/* Goal Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4>Goal</h4>
            <UpdateClientGoalModal id={clientData._id} clientData={clientData} />
          </div>
          {clientData.goal ? (
            <p className="text-[14px] text-[var(--dark-2)] leading-[1.5]">
              {clientData.goal}
            </p>
          ) : (
            <p className="text-sm italic text-[#808080]">
              Please add a goal for the client
            </p>
          )}
        </div>

        {/* Categories Section */}
        <ClientCategoriesList clientData={clientData} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <FollowUpModal clientData={clientData} />
          {/* <Button
            onClick={sendAnalysis}
            variant="wz"
            className="w-full text-xs"
          >
            Analysis Reminder
          </Button> */}
        </div>

        {/* Activities Section */}
        {Boolean(activities) && <ClientActivities activities={activities} />}

        {/* Notes Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4>Notes</h4>
            <UpdateClientNotesModal
              id={clientData._id}
              defaultValue={clientData.notes}
            />
          </div>
          <p className="text-[14px] text-[var(--dark-2)] leading-[1.5]">
            {clientData.notes || (
              <span className="text-sm italic text-[#808080]">No notes added yet</span>
            )}
          </p>
        </div>

        {/* Accordion for Detailed Sections */}
        <Accordion type="multiple" className="w-full" value={accordionValue} onValueChange={setAccordionValue}>
          {/* Personal Information */}
          <AccordionItem value="personal-info" className="border-1 rounded-lg px-4 mb-2">
            <div className="flex items-center justify-between py-2">
              <AccordionTrigger className="hover:no-underline flex-1">
                <h4 className="font-semibold">Personal Information</h4>
              </AccordionTrigger>
              <div onClick={(e) => e.stopPropagation()}>
                <UpdateClientDetailsModal clientData={clientData} />
              </div>
            </div>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {clientPortfolioFields.map((field) => (
                  <div
                    key={field.id}
                    className="text-[13px] grid grid-cols-[120px_1fr] items-center gap-3"
                    {...field}
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
                  // Get health info from clientPreferences or fallback
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
            </AccordionContent>
          </AccordionItem>

          {/* Training Information */}
          <AccordionItem value="training-info" className="border-1 rounded-lg px-4 mb-2">
            <div className="flex items-center justify-between py-2">
              <AccordionTrigger className="hover:no-underline flex-1">
                <h4 className="font-semibold">Training Information</h4>
              </AccordionTrigger>
              <div onClick={(e) => e.stopPropagation()}>
                <UpdateClientTrainingInfoModal 
                  id={clientData._id} 
                  clientData={clientData}
                />
              </div>
            </div>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {(() => {
                  // Get training modules from clientPreferences or fallback to trainingInfo
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
            </AccordionContent>
          </AccordionItem>

          {/* Supplement Intake */}
          <AccordionItem value="supplement-intake" className="border-1 rounded-lg px-4 mb-2">
            <div className="flex items-center justify-between py-2">
              <AccordionTrigger className="hover:no-underline flex-1">
                <h4 className="font-semibold">Supplement Intake Tracker</h4>
              </AccordionTrigger>
              <div onClick={(e) => e.stopPropagation()}>
                <UpdateClientSupplementIntakeModal 
                  id={clientData._id} 
                  clientData={clientData}
                />
              </div>
            </div>
            <AccordionContent>
              <div className="pt-2">
                {(() => {
                  // Get supplements from clientPreferences or fallback to supplementIntake
                  const supplements = clientData?.clientPreferences?.supplements || clientData?.supplementIntake || [];
                  
                  return supplements.length > 0 ? (
                    <div className="space-y-3">
                      {supplements.map((supplement, index) => (
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
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-[#808080]">
                      No supplement information added yet
                    </p>
                  );
                })()}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Injury Log */}
          <AccordionItem value="injury-log" className="border-1 rounded-lg px-4 mb-2">
            <div className="flex items-center justify-between py-2">
              <AccordionTrigger className="hover:no-underline flex-1">
                <h4 className="font-semibold">Injury Log</h4>
              </AccordionTrigger>
              <div onClick={(e) => e.stopPropagation()}>
                <UpdateClientInjuryLogModal 
                  id={clientData._id} 
                  clientData={clientData}
                />
              </div>
            </div>
            <AccordionContent>
              <div className="pt-2">
                {(() => {
                  // Get injuries from clientPreferences or fallback to injuryLog
                  const injuries = clientData?.clientPreferences?.injuries || clientData?.injuryLog || [];
                  
                  return injuries.length > 0 ? (
                    <div className="space-y-3">
                      {injuries.map((injury, index) => (
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
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-[#808080]">
                      No injury log entries added yet
                    </p>
                  );
                })()}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Injury Analytics Dashboard */}
          <AccordionItem value="injury-analytics" className="border-1 rounded-lg px-4 mb-2">
            <AccordionTrigger className="hover:no-underline">
              <h4 className="font-semibold">Injury Analytics Dashboard</h4>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <InjuryAnalyticsDashboard 
                  clientData={clientData} 
                  clientId={clientData._id}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ClientActivities({ activities }) {
  return (
    <div className="p-4 rounded-lg border-1 bg-[var(--comp-1)]">
      <div className="font-semibold pb-3 flex items-center gap-6 border-b-1">
        <div>
          <p className="text-[var(--accent-1)] text-xl font-bold">
            {activities.dailyActivities.reduce(
              (acc, activity) => acc + activity.steps,
              0,
            )}
          </p>
          <p className="text-sm text-[var(--dark-2)]">Steps</p>
        </div>
        <div>
          <p className="text-[var(--accent-1)] text-xl font-bold">
            {activities.dailyActivities
              .reduce((acc, activity) => acc + activity.calories, 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-[var(--dark-2)]">Calories</p>
        </div>
        <Image
          src="/svgs/circle-embedded.svg"
          height={64}
          width={64}
          alt=""
          className="ml-auto"
        />
      </div>
      <p className="text-[var(--dark-1)]/25 text-[12px] font-semibold mt-3">
        Last 7 Days
      </p>
    </div>
  );
}

function Header({ clientData }) {
  const [modalOpened, setModalOpened] = useState(false);
  const { roles, coachRefUrl } = useAppSelector((state) => state.coach.data);

  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setModalOpened(false));

  async function generateClientRollno(setLoading) {
    try {
      setLoading(true);
      const response = await sendData(`edit-rollno?id=${clientData._id}`, {
        clientId: clientData._id,
      });
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      mutate(`clientDetails/${clientData._id}`);
      setModalOpened(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function copyLoginLink() {
    const loginLink = `${coachRefUrl}/loginClient?clientID=${clientData.clientId}`;
    navigator.clipboard
      .writeText(loginLink)
      .then(() => {
        toast.success("Login link copied to clipboard!");
        setModalOpened(false);
      })
      .catch(() => {
        toast.error("Failed to copy login link");
      });
  }

  return (
    <CardHeader className="relative flex items-center gap-4 md:gap-8">
      <Avatar className="w-[80px] h-[80px] md:w-[100px] md:h-[100px]">
        <AvatarImage src={clientData.profilePhoto} />
        <AvatarFallback>{nameInitials(clientData.name)}</AvatarFallback>
      </Avatar>
      <div className="">
        <h3 className="mb-2">{clientData.name}</h3>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1]">
            ID #{clientData.clientId}
          </p>
          <div
            className="px-2 flex items-center gap-2 cursor-pointer"
            onClick={copyLoginLink}
          >
            <Copy
              strokeWidth="3"
              className="w-[14px] h-[14px] text-[var(--accent-1)]"
            />
          </div>
          <div className="w-1 h-full bg-[var(--dark-1)]/50"></div>
          {clientData.rollno && permit("club", roles) && (
            <EditClientRollnoModal
              defaultValue={clientData.rollno}
              _id={clientData._id}
            />
          )}
        </div>
        <div className="flex gap-4">
          <ClientStatus status={clientData.isActive} _id={clientData._id} />
          {/* Membership toggle commented out */}
          {/* {permit("club", roles) && (
            <ClientClubStatus
              status={clientData.isSubscription}
              _id={clientData._id}
            />
          )} */}
        </div>
      </div>
      <DropdownMenu open={modalOpened}>
        <DropdownMenuTrigger
          onClick={() => setModalOpened(true)}
          asChild
          className="!absolute top-0 right-4"
        >
          <EllipsisVertical className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          ref={dropdownRef}
          className="text-[14px] font-semibold"
        >
          <DropdownMenuItem className="cursor-pointer">
            <DeleteClientModal
              onClose={() => setModalOpened(false)}
              _id={clientData._id}
            >
              <div className="flex items-center gap-2 w-full">
                <Trash2 className="w-[16px] h-[16px] text-[var(--accent-2)]" />
                <span className="text-[var(--accent-2)]">Delete Client</span>
              </div>
            </DeleteClientModal>
          </DropdownMenuItem>
          {/* <DropdownMenuItem 
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
            }}
          >
            <ClientUpdateCategories
              onClose={() => setModalOpened(false)}
              clientData={clientData}
            >
              <div className="flex items-center gap-2 w-full">
                <Pen className="w-[16px] h-[16px] text-[var(--accent-1)]" />
                <span className="text-[var(--accent-1)]">Update Categories</span>
              </div>
            </ClientUpdateCategories>
          </DropdownMenuItem> */}
          {/* {!Boolean(clientData.rollno) && permit("club", roles) && (
            <DropdownMenuItem className="cursor-pointer">
              <DualOptionActionModal
                action={(setLoading, btnRef) =>
                  generateClientRollno(setLoading, btnRef, false)
                }
                description="Are you sure to generate a new roll number for the client?"
                onClose={() => setModalOpened(false)}
              >
                <AlertDialogTrigger className="font-semibold text-[var(--accent-1)] flex items-center gap-2 w-full">
                  <Plus
                    strokeWidth="3"
                    className="w-[16px] h-[16px] text-[var(--accent-1)]"
                  />
                  Generate Roll Number
                </AlertDialogTrigger>
              </DualOptionActionModal>
            </DropdownMenuItem>
          )} */}
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
  );
}

function ClientStatus({ status, _id }) {
  async function changeStatus(setLoading, closeBtnRef, status) {
    try {
      setLoading(true);
      const response = await sendData(
        `app/updateClientActiveStatus?id=${_id}&status=${status}`,
        {},
        "PUT",
      );
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate(`clientDetails/${_id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Menubar className="p-0 border-0 shadow-none">
      <MenubarMenu className="p-0">
        <MenubarTrigger
          className={`${status ? "bg-[var(--accent-1)] hover:bg-[var(--accent-1)]" : "bg-[var(--accent-2)] hover:bg-[var(--accent-2)]"} text-white font-bold py-[4px] md:py-[2px] px-2 text-[10px] md:text-[12px] gap-1`}
        >
          {status ? <>Active</> : <>In Active</>}
          <ChevronDown className="w-[18px]" />
        </MenubarTrigger>
        <MenubarContent sideOffset={10} align="center">
          {status ? (
            <DualOptionActionModal
              description="Are you sure to change the status of the client"
              action={(setLoading, btnRef) =>
                changeStatus(setLoading, btnRef, false)
              }
            >
              <AlertDialogTrigger className="font-semibold text-[14px] text-[var(--accent-2)] pl-4 py-1 flex items-center gap-2">
                Inactive
              </AlertDialogTrigger>
            </DualOptionActionModal>
          ) : (
            <DualOptionActionModal
              description="Are you sure to change the status of the client"
              action={(setLoading, btnRef) =>
                changeStatus(setLoading, btnRef, true)
              }
            >
              <AlertDialogTrigger className="font-semibold text-[14px] text-[var(--accent-1)] pl-4 py-1 flex items-center gap-2">
                Active
              </AlertDialogTrigger>
            </DualOptionActionModal>
          )}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function ClientClubStatus({ status, _id }) {
  async function changeStatus(setLoading, closeBtnRef, status) {
    try {
      setLoading(true);
      const response = await sendData(
        `updateClubClientStatus?id=${_id}&status=${status}`,
        {},
        "PUT",
      );
      if (!Boolean(response.data)) throw new Error(response.message);
      toast.success(response.message);
      mutate(`clientDetails/=${_id}`);
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Menubar className="p-0 border-0 shadow-none">
      <MenubarMenu className="p-0">
        <MenubarTrigger
          className={`${status ? "bg-[var(--accent-1)] hover:bg-[var(--accent-1)]" : "bg-[var(--accent-2)] hover:bg-[var(--accent-2)]"} text-white font-bold py-[4px] md:py-[2px] px-2 text-[10px]  md:text-[12px] gap-1`}
        >
          {status ? <>Membership On</> : <>Membership Off</>}
          <ChevronDown className="w-[18px]" />
        </MenubarTrigger>
        <MenubarContent sideOffset={10} align="center">
          {status ? (
            <DualOptionActionModal
              description="Are you sure to change the status of the client"
              action={(setLoading, btnRef) =>
                changeStatus(setLoading, btnRef, false)
              }
            >
              <AlertDialogTrigger className="font-semibold text-[14px] text-[var(--accent-2)] pl-4 py-1 flex items-center gap-2">
                Membership Off
              </AlertDialogTrigger>
            </DualOptionActionModal>
          ) : (
            <DualOptionActionModal
              description="Are you sure to change the membership status of the client"
              action={(setLoading, btnRef) =>
                changeStatus(setLoading, btnRef, true)
              }
            >
              <AlertDialogTrigger className="font-semibold text-[14px] text-[var(--accent-1)] pl-4 py-1 flex items-center gap-2">
                Membership On
              </AlertDialogTrigger>
            </DualOptionActionModal>
          )}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function ClientCategoriesList({ clientData }) {
  const { client_categories = [] } = useAppSelector(
    (state) => state.coach.data,
  );
  const set = new Set(clientData.categories);
  const selectedCategories = client_categories.filter((category) =>
    set.has(category._id),
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4>Categories</h4>
        <ClientUpdateCategories clientData={clientData} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {selectedCategories.length > 0 ? (
          selectedCategories.map((category, index) => (
            <Badge
              key={category._id}
              style={{
                backgroundColor: notesColors[index % 5],
                color: "#000000",
                fontWeight: "bold",
              }}
            >
              {category.name}
            </Badge>
          ))
        ) : (
          <p className="text-sm italic text-[#808080]">No categories assigned</p>
        )}
      </div>
    </div>
  );
}

function ImagePreviewDialog({ imageUrl, children }) {
  const [open, setOpen] = useState(false);

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
