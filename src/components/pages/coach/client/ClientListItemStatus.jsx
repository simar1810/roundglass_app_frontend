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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function ClientListItemStatus({
  src,
  name,
  status,
  id
}) {
  return <div className="mb-1 px-4 py-2 flex items-center gap-4">
    <Avatar className="w-[36px] h-[36px] !rounded-[8px]">
      <AvatarImage className="rounded-[8px]" src={src} />
      <AvatarFallback className="rounded-[8px]">{name.split(" ").slice(0, 2).map(word => word?.at(0)).join("")}</AvatarFallback>
    </Avatar>
    <p className="text-[12px] font-semibold mr-auto">{name}</p>
    {status
      ? <Badge className="text-white font-semibold bg-[var(--accent-1)] border-[var(--accent-1)]">Active</Badge>
      : <Badge
        variant="outline"
        className="text-[var(--accent-2)] font-semibold border-[var(--accent-2)]"
      >In Active</Badge>}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EllipsisVertical className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Action 1</DropdownMenuLabel>
        <DropdownMenuLabel>Action 2</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Action 3</DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
}