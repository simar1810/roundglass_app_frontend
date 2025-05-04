import { EllipsisVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import DeleteClientModal from "@/components/modals/client/DeleteClientModal";
import { useState } from "react";
import { nameInitials } from "@/lib/formatter";
import FollowUpModal from "@/components/modals/client/FollowUpModal";

export default function ClientListItemStatus({
  client
}) {
  const [modal, setModal] = useState();

  return <div className="mb-1 px-4 py-2 flex items-center gap-4">
    {modal}
    <Link className="grow flex items-center gap-4" href={`/coach/clients/${client._id}`}>
      <Avatar className="w-[36px] h-[36px] !rounded-[8px]">
        <AvatarImage className="rounded-[8px]" src={client.profilePhoto} />
        <AvatarFallback className="rounded-[8px]">{nameInitials(client.name)}</AvatarFallback>
      </Avatar>
      <p className="text-[12px] font-semibold mr-auto">{client.name}</p>
    </Link>
    {client.isVerified
      ? <Badge className="text-white font-semibold bg-[var(--accent-1)] border-[var(--accent-1)]">Active</Badge>
      : <Badge
        variant="outline"
        className="text-[var(--accent-2)] font-semibold border-[var(--accent-2)]"
      >Pending</Badge>}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EllipsisVertical className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem
          onClick={() => setModal(<FollowUpModal
            defaultOpen={true}
            clientData={client}
            onClose={() => setModal()}
          />)}
        >
          Follow Up
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setModal(<DeleteClientModal
            defaultOpen={true}
            _id={client._id}
            onClose={() => setModal()}
          />)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
}