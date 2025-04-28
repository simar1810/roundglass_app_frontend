"use client"
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "../ui/input";
import {
  Search,
  ChevronRight,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import {
  sidebar__coachContent,
  sidebar__coachFooter
} from "@/config/data/sidebar";
import { toast } from "sonner";
import { useAppDispatch } from "@/providers/global/hooks";
import { destroy } from "@/providers/global/slices/coach";
import { useState } from "react";

export default function AppSidebar() {
  const dispatchRedux = useAppDispatch();

  const router = useRouter();

  async function expireUserSession() {
    try {
      const response = await fetch("/api/logout", { method: "DELETE" });
      const data = await response.json();
      if (data.status_code !== 200) throw new Error(data.message);
      dispatchRedux(destroy());
      router.push("/login");
    } catch (error) {
      toast.error(error.message || "Please try again later")
    }
  }

  return (
    <Sidebar className="w-[204px] bg-[var(--dark-4)] pl-2 pr-0 border-r-1">
      <SidebarHeader className="bg-[var(--dark-4)] text-white font-cursive">
        <Image
          src="/wellnessz-white.png"
          alt="wellnessZ logo"
          width={659}
          height={125}
          className="max-w-[10ch] mx-auto mt-4"
        />
      </SidebarHeader>
      <div className="bg-[var(--dark-4)] relative pt-3 pb-4 pr-4">
        <Search className="w-[18px] h-[18px] bg-[var(--dark-1)] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
        <Input
          placeholder="Search Client..."
          className="bg-[var(--dark-1)] md:max-w-[450px] pl-8 border-0 text-white !focus:outline-none"
        />
      </div>
      <SidebarContent className="bg-[var(--dark-4)] pr-2 pb-4 custom-scrollbar">
        <SidebarGroup>
          <SidebarMenu className="px-0">
            {sidebar__coachContent.map((item) => item.items && item.items.length > 0
              ? <SidebarItemWithItems item={item} key={item.id} />
              : <SidebarItem item={item} key={item.id} />)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu className="px-0">
            {sidebar__coachFooter.map((item) => <SidebarItem item={item} key={item.id} />)}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={expireUserSession}
                className="bg-[var(--comp-1)] font-[500] text-[16px] text-[var(--accent-2)] px-4 py-4 mt-2 border-1 border-[#EFEFEF] hover:bg-[var(--comp-1)] hover:text-[var(--accent-2)]"
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function SidebarItemWithItems({ item }) {
  const [open, setOpen] = useState(false);
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  return <DropdownMenu open={open} key={item.id}>
    <SidebarMenuItem className="py-[8px]">
      <DropdownMenuTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        asChild
        className="p-0 focus:border-nonefocus:outline-none focus:ring-0 data-[state=open]:ring-0 data-[state=open]:outline-none data-[state=open]:border-transparent"
      >
        <SidebarMenuButton className={`w-full !text-[var(--comp-4)] text-[14px] font-[500] px-2 py-[8px] ${pathname.includes(item.url) ? "bg-[var(--accent-1)] !text-[var(--dark-1)]" : "hover:text-white hover:!bg-[var(--dark-1)]"}`}>
          {item.icon}
          <span>{item?.title}</span>
          <ChevronRight className="absolute right-2 top-1/2 translate-y-[-50%]" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
        className="min-w-56 bg-[var(--dark-1)] rounded-none pl-6 pr-2 py-2 border-0 relative rounded-r-[8px]"
        sideOffset={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="h-full w-[16px] bg-[var(--dark-4)] absolute left-0 top-0" />
        {item.items.map((item) => (<DropdownMenuItem
          asChild key={item.title}
          className={`!text-[var(--comp-4)] [&_.icon]:!text-[var(--comp-4)] text-[14px] mb-[2px] gap-2 ${pathname.includes(item.url) ? "bg-white !bg-[var(--accent-1)] !text-[var(--dark-1)] [&_.icon]:!text-[var(--dark-1)]" : "hover:!bg-[var(--dark-4)] hover:!text-[var(--comp-1)]  hover:[&_.icon]:!text-[var(--comp-1)]"}`}
        >
          <Link href={item.url}>
            {item.icon}
            <span>{item.title}</span>
          </Link>
        </DropdownMenuItem>))}
      </DropdownMenuContent>
    </SidebarMenuItem>
  </DropdownMenu>
}

function SidebarItem({ item }) {
  const pathname = usePathname()
  return <SidebarMenuItem className="py-[8px]" key={item.id}>
    <SidebarMenuButton asChild>
      <Link
        href={item.url}
        className={`!text-[var(--comp-4)] text-[14px] font-[500] ${pathname === item.url ? "bg-[var(--accent-1)] !text-[var(--dark-1)]" : "hover:!bg-[var(--dark-1)] hover:!text-white"}`}
      >
        {item.icon}
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
}