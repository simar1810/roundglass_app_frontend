"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Input } from "../ui/input";
import {
  Search,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
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
import { useEffect, useRef, useState } from "react";
import { fetchData } from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import Loader from "./Loader";
import useClickOutside from "@/hooks/useClickOutside";
import ContentError from "./ContentError";
import { useAppSelector } from "@/providers/global/hooks";
import PendingClientClubDataModal from "../modals/client/PendingClientClubDataModal";
import { DialogTrigger } from "../ui/dialog";
import useSWR, { mutate, useSWRConfig } from "swr";

export default function AppSidebar() {
  const [Modal, setModal] = useState();
  const { organisation } = useAppSelector(state => state.coach.data);

  let sidebarItems = sidebar__coachContent;
  if (organisation !== "Herbalife") sidebarItems = sidebar__coachContent.filter(item => item.id !== 6);

  return (
    <Sidebar className="w-[204px] bg-[var(--dark-4)] pl-2 pr-0 border-r-1">
      {Modal || <></>}
      <SidebarHeader className="bg-[var(--dark-4)] text-white font-cursive">
        <Image
          src="/wellnessz-white.png"
          alt="wellnessZ logo"
          width={659}
          height={125}
          className="max-w-[10ch] mx-auto mt-4"
        />
      </SidebarHeader>
      <ClientSearchBar setModal={setModal} />
      <SidebarContent className="bg-[var(--dark-4)] pr-2 pb-4 no-scrollbar">
        <SidebarGroup>
          <SidebarMenu className="px-0">
            {sidebarItems.map((item) => item.items && item.items.length > 0
              ? <SidebarItemWithItems
                key={item.id}
                item={item}
                Modal={Modal}
                setModal={setModal}
              />
              : <SidebarItem item={item} key={item.id} />)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu className="px-0">
            {sidebar__coachFooter.map((item) => <SidebarItem item={item} key={item.id} />)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function SidebarItemWithItems({ Modal, setModal, item }) {
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
        {item.items.map(({ Component, ...item }) => (item.type === "modal"
          ? <DropdownMenuItem
            key={item.title}
            className={`!text-[var(--comp-4)] [&_.icon]:!text-[var(--comp-4)] text-[14px] mb-[2px] gap-2 cursor-pointer hover:!text-[var(--primary-1)] hover:[&_.icon]:!text-[var(--primary-1)] hover:!bg-[var(--dark-4)]`}
            onClick={() => setModal(<Component setModal={setModal} />)}
          >
            {item.icon}
            <span>{item.title}</span>
          </DropdownMenuItem>
          : <DropdownMenuItem
            asChild
            key={item.title}
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

function ClientSearchBar({ setModal }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);

  const containerRef = useRef();
  useClickOutside(containerRef, () => setOpen(false))

  const debouncedQuery = useDebounce(searchQuery);

  useEffect(function () {
    ; (async function () {
      try {
        if (debouncedQuery === "") return
        setLoading(true)
        const response = await fetchData(`app/allClient?limit=5&search=${debouncedQuery}`);
        if (response.status_code !== 200) throw new Error(response.message || "Internal Server Error!");
        setData(response.data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQuery]);

  return <div ref={containerRef} className="bg-[var(--dark-4)] relative pt-3 pb-4 pr-4 relative">
    <Search className="w-[18px] h-[18px] bg-[var(--dark-1)] text-[#808080] absolute left-2 top-1/2 translate-y-[-50%]" />
    <Input
      placeholder="Search Client..."
      onFocus={() => setOpen(true)}
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      className="bg-[var(--dark-1)] md:max-w-[450px] pl-8 border-0 text-white !focus:outline-none"
    />
    {open && <div className="w-[calc(100%-16px)] bg-[var(--dark-1)] absolute top-16 left-0 px-2 py-2 rounded-[8px] z-[100] border-1 border-[var(--primary-1)]/40">
      <SearchedResults
        query={searchQuery}
        setQuery={setSearchQuery}
        setModal={setModal}
        loading={loading}
        data={data}
      />
    </div>}
  </div>
}

function SearchedResults({ setModal,
  loading,
  data,
  query,
  setQuery
}) {
  if (loading) return <div className="h-[150px] flex items-center justify-center">
    <Loader />
  </div>

  if (data.length === 0) return <ContentError
    className="!bg-[var(--dark-1)] !min-h-[150px] text-white text-center mt-0 border-0"
    title="No clients Founds!"
  />

  return <div className="divide-y-1 divide-y-white">
    {data.map(client => client.isVerified
      ? <ActiveClient client={client} key={client._id} />
      : <InactiveClient query={query} setQuery={setQuery} setModal={setModal} client={client} key={client._id} />
    )}
  </div>
}

function ActiveClient({ client }) {
  return <Link
    href={`/coach/clients/${client._id}`}
    className="hover:bg-[var(--accent-1)] hover:text-[var(--dark-1)] text-[var(--primary-1)] text-[12px] px-2 py-2 flex items-center gap-4"
  >
    {client.name}
    <ChevronRight className="w-[16px] h-[16px] ml-auto" />
  </Link>
}

function InactiveClient({ query, setQuery, setModal, client }) {
  const { cache } = useSWRConfig()
  return <div
    className="hover:bg-[var(--accent-1)] hover:text-[var(--dark-1)] text-[var(--primary-1)] text-[12px] px-2 py-2 flex items-center gap-4"
    onClick={() => {
      setModal(<PendingClientClubDataModal
        open={true}
        onClose={() => setModal()}
        clientData={client}
        mutateQuery={{
          search: true,
          all: true,
          query: query
        }}
        onSubmit={() => {
          setModal()
          cache.delete(`app/allClient?limit=5&search=${query}`)
          setQuery()
        }}
      >
        <DialogTrigger />
      </PendingClientClubDataModal>)
    }}
  >
    {client.name}
    <ChevronRight className="w-[16px] h-[16px] ml-auto" />
  </div>
}