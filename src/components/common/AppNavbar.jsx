import { Input } from "../ui/input";
import {
  Bell,
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

export default function AppNavbar() {
  return <nav className="py-4 px-10 flex items-center justify-end gap-4 border-b-1">
    <div className="md:max-w-[450px] w-full absolute left-1/2 translate-x-[-50%]">
      <Search className="w-[18px] h-[18px] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
      <Input
        placeholder="Search..."
        className="bg-[var(--comp-1)] md:max-w-[450px] pl-8 !focus:outline-none"
      />
    </div>
    <Bell fill="#67BC2A" className="w-[20px] h-[20px] text-[var(--accent-1)]" />
    <Menubar className="p-0">
      <MenubarMenu>
        <MenubarTrigger className="flex items-center gap-2">
          <Avatar className="w-[24px] h-[24px] bg-red-200">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>SP</AvatarFallback>
          </Avatar>
          <span>Simarpreet Singh</span>
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