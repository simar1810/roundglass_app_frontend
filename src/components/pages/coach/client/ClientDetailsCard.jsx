import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger
} from "@/components/ui/menubar";
import {
  CalendarRange,
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Target,
  Trash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function ClientDetailsCard() {
  return <Card className="bg-white rounded-[18px] shadow-none">
    <CardHeader className="relative flex items-center gap-4 md:gap-8">
      <Avatar className="w-[100px] h-[100px]">
        <AvatarImage src="" />
        <AvatarFallback>SN</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="mb-2">John Lane</h3>
        <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1] mb-2">ID #123456</p>
        <Menubar className="p-0 border-0 shadow-none">
          <MenubarMenu className="p-0">
            <MenubarTrigger className="bg-[var(--accent-1)] text-white font-bold py-[2px] px-2 hover:bg-[var(--accent-1)] text-[12px] gap-1">
              Active
              <ChevronDown className="w-[18px]" />
            </MenubarTrigger>
            <MenubarContent sideOffset={10} align="center">
              <MenubarItem>Inactive</MenubarItem>
              <MenubarItem>Active</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="!absolute top-0 right-4">
          <EllipsisVertical className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="text-[14px] font-semibold">
          <DropdownMenuLabel className="font-semibold flex items-center gap-2">
            <Pencil className="w-[16px]" />
            Edit Details
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-1" />
          <DropdownMenuLabel className="font-semibold text-[var(--accent-2)] flex items-center gap-2">
            <Trash className="w-[16px]" />
            Delete Client
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <h4>Goal</h4>
        <Button variant="wz_ghost" size="sm">Edit</Button>
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.3] mt-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
      <div className="mt-4 flex items-center gap-2">
        <Button className="grow" variant="wz">
          <Target />
          Edit Goal
        </Button>
        <Button className="grow" variant="wz">
          <CalendarRange />
          Follow-up
        </Button>
      </div>
      <div className="mt-4 p-4 rounded-[10px] border-1">
        <div className="font-semibold pb-2 flex items-center gap-6 border-b-1">
          <div>
            <p className="text-[var(--accent-1)]">122</p>
            <p>Steps</p>
          </div>
          <div>
            <p className="text-[var(--accent-1)]">1543</p>
            <p>Calories</p>
          </div>
          <Image
            src="/svgs/circle-embedded.svg"
            height={64}
            width={64}
            alt=""
            className="ml-auto"
          />
        </div>
        <p className="text-[var(--dark-1)]/25 text-[12px] font-semibold mt-2">Last 7 Days</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h4>Personal Information</h4>
        <Button variant="wz_ghost" size="sm">
          <Pencil />
          Edit
        </Button>
      </div>
      <div className="mt-4 pl-4">
        {Array.from({ length: 10 }, (_, i) => i).map(item => <div key={item} className="text-[13px] mb-1 grid grid-cols-4 items-center gap-2">
          <p>Email ID</p>
          <p className="text-[var(--dark-2)] col-span-2">:&nbsp;rowan.brown@gmail.com</p>
        </div>)}
      </div>
    </CardContent>
  </Card>
}