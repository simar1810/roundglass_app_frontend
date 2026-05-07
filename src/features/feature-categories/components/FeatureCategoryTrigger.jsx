import { Layers } from "lucide-react";
import Link from "next/link";
import { featuresList } from "../config";
import { useMemo } from "react";

export default function FeatureCategoryTrigger({ feature }) {
  const featureData = useMemo(() => featuresList[feature], [feature])
  return <Link
    href={featureData.href}
    className="group flex items-center gap-2 px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-[#70C041] hover:bg-[#70C041]/5 transition-all duration-200 shadow-sm"
  >
    <Layers
      size={16}
      className="text-zinc-400 group-hover:text-[#70C041] transition-colors"
    />
    <span className="text-[14px] font-semibold text-zinc-600 group-hover:text-[#70C041] transition-colors">
      Categories
    </span>
  </Link>
}