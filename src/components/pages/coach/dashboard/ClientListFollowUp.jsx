import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

export default function ClientListFollowUp({
  src,
  name,
  id
}) {
  return <div className="mb-1 px-4 py-2 flex items-center gap-4">
    <Avatar className="w-[36px] h-[36px] !rounded-[8px]">
      <AvatarImage className="rounded-[8px]" src={src} />
      <AvatarFallback className="rounded-[8px]">{name.split(" ").slice(0, 2).map(word => word?.at(0)).join("")}</AvatarFallback>
    </Avatar>
    <p className="text-[14px] font-semibold">{name}</p>
    <Link className="w-[16px] h-[16px] ml-auto" href={"/coach/clients/" + id}>
      {/* <Clock className="w-[14px] h-[14px]" />
      Schedule */}
      <ChevronRight className="w-[16px] h-[16px]" />
    </Link>
  </div>
}