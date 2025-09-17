"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { ClientwiseHistory } from "@/components/pages/coach/physical-club/ClientwiseHistory";
import ClubHistoryPage from "@/components/pages/coach/physical-club/ClubHistory";
import DailyAttendancePage from "@/components/pages/coach/physical-club/DailyAttendance";
import ManualAttendance from "@/components/pages/coach/physical-club/ManualAttendance";
import QRCodeModal from "@/components/pages/coach/physical-club/QRCodeModal";
import ShakeRequestsTable from "@/components/pages/coach/physical-club/ShakeRequestsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPhysicalAttendance } from "@/lib/fetchers/app";
import { ClipboardCheck, Bell, Users, Building2, CalendarDays, ExternalLink } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

const tabItems = [
  {
    icon: <ClipboardCheck className="w-[16px] h-[16px]" />,
    value: "manual-attendance",
    label: "Manual Attendance"
  },
  {
    icon: <Bell className="w-[16px] h-[16px]" />,
    value: "shake-requests",
    label: "Shake Requests",
    badge: 15
  },
  {
    icon: <Users className="w-[16px] h-[16px]" />,
    value: "clientwise-history",
    label: "Clientwise History"
  },
  {
    icon: <Building2 className="w-[16px] h-[16px]" />,
    value: "club-history",
    label: "Club History"
  },
  {
    icon: <CalendarDays className="w-[16px] h-[16px]" />,
    value: "daily-attendance",
    label: "Daily Attendance"
  },
];

export default function Page() {
  const [query, setQuery] = useState("");

  const { isLoading, error, data } = useSWR(
    "app/physical-club/attendance",
    () => getPhysicalAttendance({
      person: "coach",
      populate: "client:name|mobileNumber|rollno|profilePhoto|isPhysicalClubActive,membership:membershipType|pendingServings|endDate",
      limit: 1000000
    })
  );

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const attendance = data?.data?.results || []

  return <div className="content-container content-height-screen">
    <div className="mb-8 flex items-center justify-between">
      <h4>Attendance Management System</h4>
      <QRCodeModal />
    </div>

    <Tabs defaultValue="manual-attendance">
      <Header />
      <ToolsBar query={query} setQuery={setQuery} />
      <ManualAttendance query={query} data={attendance} />
      <ShakeRequestsTable query={query} data={attendance} />
      <ClientwiseHistory query={query} data={attendance} />
      <ClubHistoryPage query={query} data={attendance} />
      <DailyAttendancePage query={query} data={attendance} />
    </Tabs>
  </div>
}

function Header() {
  return <TabsList className="w-full h-auto bg-transparent p-0 mb-4 flex items-start gap-x-2 gap-y-3 flex-wrap rounded-none no-scrollbar">
    {tabItems.map(({ icon, value, label, showIf }) =>
      <TabsTrigger
        key={value}
        className="min-w-[110px] mb-[-5px] px-2 font-semibold flex-1 basis-0 flex items-center gap-1 rounded-[10px] py-2
             data-[state=active]:bg-[var(--accent-1)] data-[state=active]:text-[var(--comp-1)]
             data-[state=active]:shadow-none text-[#808080] bg-[var(--comp-1)] border-1 border-[#EFEFEF]"
        value={value}
      >
        {icon}
        {label}
      </TabsTrigger>
    )}
  </TabsList>
}

function ToolsBar({
  query,
  setQuery
}) {
  return <div className="flex items-center justify-between mb-4">
    <Input
      placeholder="Search Client"
      className="w-64"
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
    <Button variant="wz">
      Export
      <ExternalLink />
    </Button>
  </div>
}