'use client';
import Image from "next/image";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getMarathons } from "@/lib/fetchers/app";
import useSWR, { mutate } from "swr";
import FormControl from "@/components/FormControl";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function schedule() {
  const { isLoading, error, data } = useSWR("app/getMarathons", getMarathons);
  const [selectedMarathonId, setSelectedMarathonId] = useState("");

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const marathons = data.data;

  return <div className="grid grid-cols-2 items-start gap-8">
    <ListMarathons
      setSelectedMarathonId={setSelectedMarathonId}
      marathons={marathons}
    />
    <SelectedMarathonDetails
      marathon={marathons.find(marathon => marathon._id === selectedMarathonId)}
    />
  </div>
}

function ListMarathons({ marathons, setSelectedMarathonId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const marathonsToDisplay = marathons.filter(marathon => marathon.title
    .toLowerCase()
    .includes(searchQuery.toLowerCase()))

  return <div className="content-container">
    <FormControl
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      className="[&_.input]:text-[14px] [&_.input]:bg-[var(--comp-1)]"
      placeholder="Search Here..."
    />
    <div className="flex items-center justify-between gap-4">
      <h3 className="my-4">{marathons.length} Marathons available</h3>
      <CreateMarathonModal />
    </div>
    <div className="divide-y-4 divide-[var(--comp-2)]">
      {marathonsToDisplay.length === 0
        ? <ContentError
          className="border-0"
          title="No marathons found for this search query!"
        />
        : marathonsToDisplay.map(marathon => <div className="py-2" key={marathon._id}>
          <div className="flex items-center gap-2">
            <h5 className="text-[14px]">{marathon.title}</h5>
            <Eye className="w-[16px] h-[16px] text-[var(--dark-1)]/50 cursor-pointer" onClick={() => setSelectedMarathonId(marathon._id)} />
            <AssignMarathonModal marathonId={marathon._id} />
          </div>
          {marathon.clients.slice(0, 4).map((client, index) => <div key={index} className="mb-2 flex items-center gap-2">
            <Avatar>
              <AvatarImage src={"/"} />
              <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div className="text-[12px] font-bold">{client.name}</div>
          </div>)}
        </div>)
      }
    </div>
  </div>
}

function SelectedMarathonDetails({ marathon }) {
  if (!marathon) return <div className="content-container">
    <ContentError
      className="border-0"
      title="Select a marathon to see details"
    />
  </div>
  return <div className="content-container">
    <div className="flex items-center gap-4">
      <h4 className="leading-[1] mb-4 mr-auto">{marathon.title}</h4>
      <CreateMarathonModal type="update" data={marathon}>
        <DialogTrigger className="bg-[var(--accent-1)] text-[var(--primary-1)] text-[12px] leading-[1] font-semibold px-3 py-2 rounded-[8px]">
          Edit
        </DialogTrigger>
      </CreateMarathonModal>
      <DeleteMarathonAction marathonId={marathon._id} />
    </div>
    {marathon.tasks.map(task => <div className="mb-4 p-4 flex items-center gap-4 border-1 rounded-[10px]" key={task._id}>
      <div>
        <h3>{task.title}</h3>
        <p className="text-[var(--dark-1)]/32 text-[14px] font-[500] mt-1">{task.description}</p>
        {task.photoSubmission && <p className="text-[var(--dark-1)]/25 text-[14px] italic mt-4">* Photo required at Submission</p>}
        {task.videoSubmission && <p className="text-[var(--dark-1)]/25 text-[14px] italic">* Video required at Submission</p>}
      </div>
      <Image
        src="/svgs/marathon.svg"
        alt=""
        width={500}
        height={500}
        className="max-w-20 ml-auto object-contain"
      />
    </div>)}
  </div>
}

function DeleteMarathonAction({ marathonId }) {
  async function deleteMarathon(
    setLoading,
    closeBtnRef
  ) {
    try {
      setLoading(true);
      const response = await sendData("app/marathon/coach/deleteMarathon", { marathonId }, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("app/getMarathons");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <DualOptionActionModal
    description="Are you sure of deleting this marathon!"
    action={(setLoading, btnRef) => deleteMarathon(setLoading, btnRef)}
  >
    <AlertDialogTrigger>
      <Trash2 className="w-[28px] h-[28px] text-white bg-[var(--accent-2)] p-[6px] rounded-[4px]" />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}