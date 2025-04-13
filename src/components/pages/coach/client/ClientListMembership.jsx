import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircleAlert, CircleArrowRight } from "lucide-react";
import Link from "next/link";

export default function ClientListMembership({
  src = "/",
  name = "Dnyaneshwar Kawade",
  id = 1234,
  status = Math.random() > 0.5
}) {
  return <div className="mb-1 px-4 py-2 flex items-center gap-4">
    <Avatar className="w-[48px] h-[48px] !rounded-[8px]">
      <AvatarImage className="rounded-[8px]" src={src} />
      <AvatarFallback className="rounded-[8px]">{name.split(" ").slice(0, 2).map(word => word?.at(0)).join("")}</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-[14px] font-semibold">{name}</p>
      {status && <div className="text-[9px] font-[500] text-[var(--accent-1)] flex items-center gap-2">
        <p>Subscription Expiring in 60 Days</p>
        <p>Active till 01/01/2026</p>
      </div>}
      {!status && <div className="text-[9px] font-[500] text-[var(--accent-2)] flex items-center gap-1">
        <CircleAlert className="w-[10px] h-[10px]" />
        <p>Subscription Expiring in 60 Days</p>
        <p className="ml-4">Active till 01/01/2026</p>
      </div>}
    </div>
    <Link
      className="text-[12px] text-[var(--accent-1)] font-semibold ml-auto"
      href={"/coach/client/" + id}
    >
      <CircleArrowRight className="w-[20px]" />
    </Link>
  </div>
}