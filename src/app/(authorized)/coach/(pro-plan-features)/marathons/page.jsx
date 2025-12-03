'use client';
import Image from "next/image";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getMarathonLeaderBoard, getMarathons } from "@/lib/fetchers/app";
import useSWR, { mutate, useSWRConfig } from "swr";
import FormControl from "@/components/FormControl";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";
import { useState } from "react";
import AssignMarathonModal from "@/components/modals/app/AssignMarathonModal";
import CreateMarathonModal, { DeleteMarathonTasks } from "@/components/modals/app/CreateMarathonModal";
import { DialogTrigger } from "@/components/ui/dialog";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { sendData } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreateMarathonTaskModal from "@/components/modals/tools/CreateMarathonTaskModal";

export default function Page() {
  const { isLoading, error, data } = useSWR("app/getMarathons", getMarathons);
  const [selectedMarathonId, setSelectedMarathonId] = useState("");

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const marathons = data.data;

  return <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-2 md:gap-8">
    {!Boolean(selectedMarathonId) && <ListMarathons
      setSelectedMarathonId={setSelectedMarathonId}
      marathons={marathons}
    />}
    <SelectedMarathonDetails
      setSelectedMarathonId={setSelectedMarathonId}
      marathon={marathons.find(marathon => marathon._id === selectedMarathonId)}
    />
    {selectedMarathonId && < MarathonLeaderBoard
      marathon={marathons.find(marathon => marathon._id === selectedMarathonId)}
      marathonId={selectedMarathonId}
    />}
  </div>
}

function ListMarathons({ marathons, setSelectedMarathonId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const marathonsToDisplay = marathons.filter(marathon => marathon.title
    .toLowerCase()
    .includes(searchQuery.toLowerCase()))

  return (
    <div className="content-container space-y-6">
      <div className="">
        <FormControl
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search marathons..."
          className="[&_.input]:text-[14px] [&_.input]:bg-[var(--comp-1)]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <h3 className="text-[15px] font-semibold text-[var(--dark-1)] mr-auto">
          {marathons.length} Marathons
        </h3>

        <div className="flex items-center gap-2">
          <DeleteMarathonTasks />
          <CreateMarathonModal />
          <CreateMarathonTaskModal />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden shadow-sm bg-gray-50 px-2 py-2">
        {marathonsToDisplay.length === 0 ? (
          <ContentError
            className="border-0 py-6"
            title="No marathons found for this search query!"
          />
        ) : (
          marathonsToDisplay.map(marathon => (
            <div
              key={marathon._id}
              className=" px-4 py-4 mb-2 border-b transition-colors bg-white rounded-2xl shadow-md shadow-gray-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <h5 className="text-[14px] font-medium">{marathon.title}</h5>

                <Eye
                  className="w-[18px] h-[18px] text-[var(--dark-1)]/50 cursor-pointer hover:text-[var(--dark-1)] transition"
                  onClick={() => setSelectedMarathonId(marathon._id)}
                />

                <AssignMarathonModal marathonId={marathon._id} />
              </div>

              <div className="flex flex-col gap-2">
                {marathon.clients.slice(0, 4).map((client, index) => (
                  <Link
                    href={`/coach/clients/${client._id}`}
                    key={index}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={"/"} />
                      <AvatarFallback>
                        {nameInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-[13px] font-medium group-hover:opacity-70 transition">
                      {client.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SelectedMarathonDetails({
  marathon,
  setSelectedMarathonId
}) {
  if (!marathon) return <div className="content-container">
    <ContentError
      className="border-0"
      title="Select a marathon to see details"
    />
  </div>
  return (
    <div className="content-container space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <ArrowLeft
          className="w-[22px] h-[22px] cursor-pointer text-[var(--dark-1)]/70 hover:text-[var(--primary)] transition"
          onClick={() => setSelectedMarathonId("")}
        />

        <h4 className="text-[20px] font-semibold tracking-tight mr-auto">
          {marathon.title}
        </h4>

        <CreateMarathonModal type="update" data={marathon}>
          <DialogTrigger className="
            bg-[var(--accent-1)] text-[var(--primary-1)] 
            text-[13px] font-semibold px-4 py-2 
            rounded-xl border border-[var(--primary-1)]/20
          ">
            Edit
          </DialogTrigger>
        </CreateMarathonModal>
        <DeleteMarathonAction marathonId={marathon._id} />
      </div>

      <div>
        <AssignMarathonModal marathonId={marathon._id} />
      </div>

      <div className="space-y-4 mt-4">
        {marathon.tasks.map((task) => (
          <div
            key={task._id}
            className="
              flex items-start gap-4 
              p-5 rounded-2xl 
              bg-white/90 backdrop-blur-sm
              border border-[var(--comp-2)]
              shadow-md
            "
          >
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-[var(--dark-1)]">
                {task.title}
              </h3>

              <p className="text-[var(--dark-1)]/60 text-[14px] mt-1">
                {task.description}
              </p>

              {task.photoSubmission && (
                <p className="text-[var(--dark-1)]/30 text-[13px] italic mt-3">
                  * Photo required at submission
                </p>
              )}

              {task.videoSubmission && (
                <p className="text-[var(--dark-1)]/30 text-[13px] italic">
                  * Video required at submission
                </p>
              )}
            </div>
            <Image
              src="/svgs/marathon.svg"
              alt=""
              width={80}
              height={80}
              className="opacity-80 object-contain ml-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteMarathonAction({ marathonId }) {
  async function deleteMarathon(
    setLoading
  ) {
    try {
      setLoading(true);
      const response = await sendData("app/marathon/coach/deleteMarathon", { marathonId }, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      location.reload()
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

function getBgColor(index) {
  switch (index) {
    case 0:
      return "bg-[#FFDA47]";
    case 1:
      return "bg-[#F1EAEA]";
    case 2:
      return "bg-[#D7A07C]";

    default:
      return "bg-[var(--comp-1)]";
  }
}

function MarathonLeaderBoard({ marathon, marathonId }) {
  const router = useRouter();
  const { cache } = useSWRConfig();
  const { isLoading, error, data } = useSWR(`app/marathon-points/${marathonId}`, () => getMarathonLeaderBoard(marathonId, router, cache));

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const clients = data.data;
  return <div className="content-container">
    <div className="flex items-center gap-4">
      <h4 className="leading-[1] mb-4 mr-auto">{marathon.title}</h4>
    </div>
    <div>
      {clients.map((client, index) => <div
        className={`mb-4 p-4 flex items-center gap-4 border-1 rounded-[10px] ${getBgColor(index)}`}
        key={index}>
        <span>{index + 1}</span>
        <Avatar>
          <AvatarImage src={client.client.profilePhoto} />
          <AvatarFallback>{nameInitials(client.client.name)}</AvatarFallback>
        </Avatar>
        <h3>{client.client.name}</h3>
        <p className="ml-auto">{client.totalPointsInRange}&nbsp;pts</p>
      </div>)}
    </div>
  </div>;
}