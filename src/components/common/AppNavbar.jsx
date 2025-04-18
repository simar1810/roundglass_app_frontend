"use client"
import { Input } from "../ui/input";
import {
  ChevronDown,
  Search
} from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger
} from "../ui/menubar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "../ui/avatar";
import NotificationModal from "../modals/NotificationModal";
import { useAppSelector } from "@/providers/global/hooks";

export default function AppNavbar() {
  const data = useAppSelector(state => state.coach.data)
  if (!data) return <></>

  const { profilePhoto, name } = data;

  return <nav className="bg-white sticky top-0 py-4 px-10 flex items-center justify-end gap-4 border-b-1 z-[10]">
    <div className="md:max-w-[450px] w-full absolute left-1/2 translate-x-[-50%]">
      <Search className="w-[18px] h-[18px] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
      <Input
        placeholder="Search..."
        className="bg-[var(--comp-1)] md:max-w-[450px] pl-8 !focus:outline-none"
      />
    </div>
    <NotificationModal />
    <Menubar className="p-0">
      <MenubarMenu>
        <MenubarTrigger className="flex items-center gap-2">
          <Avatar className="w-[24px] h-[24px] bg-red-200">
            <AvatarImage src={profilePhoto} />
            <AvatarFallback className="bg-[#172A3A] text-white uppercase">{name.split(" ").map(letter => letter[0]).join("")}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
          <ChevronDown className="w-[16px] ml-2" />
        </MenubarTrigger>
        <MenubarContent sideOffset={10} align="center">
          {Array.from({ length: 4 }, (_, i) => i).map(item => <MenubarItem
            key={item}
          >
            Link-{item}
          </MenubarItem>)}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  </nav>
}