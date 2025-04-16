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
      toast(error.message || "Please try again later")
    }
  }

  return (
    <Sidebar className="bg-white px-2 border-r-1">
      <Image
        src="/wz-landscape.png"
        height={200}
        width={400}
        alt="WellnessZ logo landscape"
        className="w-[200px] h-[64px] mx-auto mt-2 object-contain"
      />
      <div className="relative mt-3 mb-4">
        <Search className="w-[18px] h-[18px] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
        <Input
          placeholder="Search Client..."
          className="bg-[var(--comp-1)] md:max-w-[450px] pl-8 !focus:outline-none"
        />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebar__coachContent.map((item) => item.items && item.items.length > 0
              ? <SidebarItemWithItems item={item} key={item.id} />
              : <SidebarItem item={item} key={item.id} />)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            {sidebar__coachFooter.map(item => <SidebarItem
              item={item}
              key={item.id}
            />)}
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
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarItemWithItems({ item }) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  return <DropdownMenu key={item.id} className="mb-2">
    <SidebarMenuItem>
      <DropdownMenuTrigger asChild className="hover:text-white">
        <SidebarMenuButton className={`w-full !text-[var(--dark-1)]/25 text-[16px] font-[500] hover:!text-white ${pathname.includes(item.url) && "bg-[var(--accent-1)] !text-white"}`}>
          {item.icon}
          <span>{item?.title}</span>
          <ChevronRight className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
        className="min-w-56 bg-[var(--accent-1)] rounded-none px-2 py-2"
      >
        {item.items.map((item) => (<DropdownMenuItem
          asChild key={item.title}
          className={`text-white [&_.icon]:!text-white hover:[&_.icon]:!text-[var(--accent-1)] hover:!text-white hover:!bg-white hover:!text-[var(--accent-1)] text-[16px] mb-[2px] gap-2 ${pathname.includes(item.url) && "bg-white !text-[var(--accent-1)] [&_.icon]:!text-[var(--accent-1)]"}`}
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
  return <SidebarMenuItem key={item.id} className="mb-[2px]">
    <SidebarMenuButton asChild>
      <Link
        href={item.url}
        className={`!text-[var(--dark-1)]/25 !hover:bg-[var(--accent-1)] hover:!text-white text-[16px] font-[500] ${pathname === item.url && "bg-[var(--accent-1)] !text-white"}`}
      >
        {item.icon}
        <span>{item.title} </span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
}