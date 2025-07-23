import AddClientWithCheckup from "@/components/modals/add-client/AddClientWithCheckup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { useState } from "react";

export default function ClientListFollowUp({
  src,
  name,
  id
}) {
  const [modalOpened, setModalOpened] = useState(false);

  return <div onClick={() => setModalOpened(true)} className="mb-1 px-4 py-2 flex items-center gap-4 cursor-pointer">
    <Avatar className="w-[36px] h-[36px] !rounded-[8px]">
      <AvatarImage className="rounded-[8px]" src={src} />
      <AvatarFallback className="rounded-[8px]">{name.split(" ").slice(0, 2).map(word => word?.at(0)).join("")}</AvatarFallback>
    </Avatar>
    <p className="text-[14px] font-semibold">{name}</p>
    <Clock className="w-[14px] h-[14px] text-[var(--accent-2)] ml-auto" strokeWidth={3} />
    {modalOpened && <AddClientWithCheckup
      type="add-details"
      data={{ _id: id, name }}
      setModal={setModalOpened}
    />}
  </div>
}