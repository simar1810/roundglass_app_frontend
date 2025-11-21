"use client";
import { useAppSelector } from "@/providers/global/hooks";
import Image from "next/image";

export default function Layout({ children }) {
  const { features } = useAppSelector(state => state.coach.data)

  if (!features.includes(6)) return <div className="content-height-screen content-container">
    <div className="relative">
      <Image
        src="/illustrations/support.svg"
        alt=""
        height={300}
        width={300}
        className="object-contain mx-auto mt-24"
      />
      <h3 className="text-center mt-4">This feature is not enabled. Please contact our customer support.</h3>
    </div>
  </div>
  return children
}