import TopPerformerClientList from "./ClientListTopPerformer";
import { useState } from "react";
import QuickAddClient from "@/components/modals/add-client/QuickAddClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TopPerformers({ clients }) {
  const [modalOpened, setModalOpened] = useState(false);

  return <div className="bg-white py-4 rounded-[10px]">
    <div className="mb-4 px-4 flex items-center justify-between">
      <p className="text-[14px] font-bold">Top Performers</p>
      {modalOpened && <QuickAddClient setModal={setModalOpened} />}
      <Button
        variant="wz"
        size="sm"
        className="h-auto text-[12px] py-2 gap-1"
        onClick={() => setModalOpened(true)}
      >
        <Plus />
        Add Client
      </Button>
    </div>
    <div className="divide-y-1 divide-[#ECECEC]">
      {clients.map(client => <TopPerformerClientList
        key={client.clientId}
        src={client.profilePhoto}
        name={client.name}
        id={client.clientId}
      />)}
    </div>
  </div>
}