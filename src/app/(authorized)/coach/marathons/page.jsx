'use client';
import Image from "next/image";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { getMarathons } from "@/lib/fetchers/app";
import useSWR from "swr";
import FormControl from "@/components/FormControl";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";
import { useState } from "react";
import AssignMarathonModal from "@/components/modals/app/AssignMarathonModal";
import CreateMarathonModal from "@/components/modals/app/CreateMarathonModal";

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
    <h4 className="mb-4">{marathon.title}</h4>
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