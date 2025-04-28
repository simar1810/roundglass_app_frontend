"use client"
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "../ui/avatar";
import NotificationModal from "../modals/NotificationModal";
import { useAppSelector } from "@/providers/global/hooks";
import Link from "next/link";

export default function AppNavbar() {
  const data = useAppSelector(state => state.coach.data)
  if (!data) return <></>

  const { profilePhoto, name } = data;

  return <nav className="bg-white sticky top-0 py-4 px-10 flex items-center justify-end gap-4 border-b-1 z-[30]">
    <div className="md:max-w-[450px] w-full absolute left-1/2 translate-x-[-50%]">
      <Search className="w-[18px] h-[18px] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
      <Input
        placeholder="Search..."
        className="bg-[var(--comp-1)] md:max-w-[450px] pl-8 !focus:outline-none"
      />
    </div>
    <NotificationModal />
    <Link href="/coach/portfolio" className="px-4 py-2 flex items-center gap-2 border-1 rounded-[8px]">
      <Avatar className="w-[24px] h-[24px] border-1  border-[var(--accent-1)]">
        <AvatarImage src={profilePhoto} />
        <AvatarFallback className="bg-[#172A3A] text-white uppercase">{name.split(" ").map(letter => letter[0]).join("")}</AvatarFallback>
      </Avatar>
      <p className="text-[var(--dark-1)]/50 text-[14px] leading-[1] font-[500]">{name}</p>
    </Link>
  </nav>
}