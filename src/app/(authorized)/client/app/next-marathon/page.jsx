'use client';
import Image from "next/image";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getClientNextMarathonClient, getMarathonLeaderBoard, getMarathons } from "@/lib/fetchers/app";
import useSWR, { mutate, useSWRConfig } from "swr";
import FormControl from "@/components/FormControl";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";
import { useState } from "react";
import AssignMarathonModal from "@/components/modals/app/AssignMarathonModal";
import CreateMarathonModal from "@/components/modals/app/CreateMarathonModal";
import { DialogTrigger } from "@/components/ui/dialog";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { sendData } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export default function Page() {
  const { isLoading, error, data } = useSWR(
    "client/marathon",
    () => getClientNextMarathonClient(format(new Date(), "dd-MM-yyyy")))
  const [selectedMarathonId, setSelectedMarathonId] = useState("");

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const marathons = data.data;

  return <div className="grid items-start gap-8">
    <SelectedMarathonDetails
      setSelectedMarathonId={setSelectedMarathonId}
      marathon={marathons?.at(0)}
    />
  </div>
}


function SelectedMarathonDetails({ marathon }) {
  if (!marathon)
    return (
      <div className="content-container">
        <ContentError className="border-0" title="Select a marathon to see details" />
      </div>
    );

  const formattedDate = marathon.date;

  const totalPoints = marathon.tasks
    .reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="content-container space-y-5">
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500">
        <span className="text-sm font-medium opacity-70 italic">Date:</span>
        <span className="text-base font-semibold italic">{formattedDate}</span>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-wide">{marathon.marathonTitle}</h2>
      </div>
      <div className="bg-gradient-to-r from-green-500/90 to-green-600 text-white 
                      p-5 rounded-xl shadow-md flex items-center justify-between">
        <div className="text-lg font-semibold">
          Total Points Earned
        </div>
        <div className="text-xl font-bold">
          {marathon.totalPoints} / {totalPoints}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {marathon.tasks.map((task) => (
          <div
            key={task.taskId}
            className="rounded-xl pt-5 bg-white shadow-lg hover:shadow-xl 
                       transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start px-5">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{task.description}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold 
                  ${task.isCompleted 
                    ? "bg-green-100 text-green-700 border border-green-300" 
                    : "bg-red-100 text-red-600 border border-red-300"
                  }`}
              >
                {task.isCompleted ? "Completed" : "Pending"}
              </span>
            </div>
            <div className="mt-3 space-y-1 px-5">
              {task.photoSubmission && (
                <p className="text-[13px] text-gray-500 italic">
                  * Photo required for submission
                </p>
              )}
              {task.videoSubmission && (
                <p className="text-[13px] text-gray-500 italic">
                  * Video required for submission
                </p>
              )}
            </div>
            <div className="mt-4 px-5">
              <p className="font-medium text-sm">Submitted Photo:</p>
              {task.photoUrl ? (
                <Image
                  src={task.photoUrl}
                  alt="Submitted Photo"
                  width={240}
                  height={160}
                  className="rounded-md border mt-2 object-cover"
                />
              ) : (
                <p className="text-gray-400 text-sm mt-1 italic">No photo submitted</p>
              )}
            </div>
            <div className="mt-4 px-5">
              <p className="font-medium text-sm">Submitted Video:</p>
              {task.videoUrl ? (
                <video
                  controls
                  src={task.videoUrl}
                  className="rounded-md border w-full mt-2"
                />
              ) : (
                <p className="text-gray-400 text-sm mt-1 italic">No video submitted</p>
              )}
            </div>
            <div className="mt-5 flex justify-between items-center border-t py-3 bg-zinc-50 px-5">
            <div className="">
              <p className="text-sm text-gray-400 font-medium">
                Points: <span className="font-semibold text-gray-500">{task.points}</span>
              </p>
            </div>
              <Image
                src="/svgs/marathon.svg"
                alt=""
                width={60}
                height={60}
                className="opacity-70 w-10"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}