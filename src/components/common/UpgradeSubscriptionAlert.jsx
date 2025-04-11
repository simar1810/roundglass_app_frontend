import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

export default function UpgradeSubscriptionAlert() {
  return <div className="p-[10px] flex items-center gap-4 border-2 border-[var(--accent-1)] rounded-[10px]">
    <div className="h-full p-2 bg-[var(--accent-1)]/25 rounded-[4px]">
      <TriangleAlertIcon className="w-[32px] text-[var(--accent-1)] aspect-square" />
    </div>
    <div>
      <h4 className="text-[14px]">29 Days Left In Free Trial</h4>
      <p className="text-[var(--dark-2)] text-[10px]">A Short line will comed here describing what will happen after 29 day trial period is over.</p>
    </div>
    <Link href="/coach/subscription" className="bg-[var(--accent-1)] text-white text-[14px] font-bold px-6 py-[10px] ml-auto rounded-[8px]">
      Upgrade Now
    </Link>
  </div>
}