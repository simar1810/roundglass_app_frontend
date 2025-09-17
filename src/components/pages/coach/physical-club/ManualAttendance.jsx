"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { manualAttendance } from "@/lib/physical-attendance";
import { endOfMonth, startOfMonth } from "date-fns";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sendData } from "@/lib/api";
import { toast } from "sonner";
import { mutate } from "swr";
import { Check, CheckCircle, X } from "lucide-react";

export default function ManualAttendance({
  data,
  query
}) {
  const [range, setRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const clients = manualAttendance(data, range)
    .filter(client => new RegExp(query, "i").test(client?.name))

  return (<TabsContent value="manual-attendance" className="flex gap-6">
    <AttendanceClients clients={clients} />
    <div className="flex-1">
      <AttendanceCalendar range={range} setRange={setRange} />
      <AttendanceSummary clients={clients} />
    </div>
  </TabsContent>
  );
}

export function AttendanceClients({ clients }) {
  return (
    <div className="flex-1 space-y-2 bg-[var(--comp-1)] border-1 p-2 rounded-[8px]">
      <div className="mb-4 text-lg font-semibold">
        All Clients <span className="text-gray-500 text-sm">({clients.length})</span>
      </div>
      <div className="space-y-3">
        {clients.map((client, i) => (
          <div key={i} className="flex justify-between items-center border-b pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={client.profilePhoto} />
                <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
              </Avatar>
              <span>{client.name}</span>
            </div>
            <div className="flex gap-2">
              <ChangeClientAttendanceStatus status="present">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("rounded-full font-bold hover:text-[var(--accent-1)]", client.status === "present"
                    ? "bg-[var(--accent-1)] hover:bg-[var(--accent-1)] hover:border-[var(--accent-1)] text-white hover:text-white"
                    : "text-[var(--accent-1)] border-[var(--accent-1)] hover:border-[var(--accent-1)]")}
                >
                  <CheckCircle className={cn(client.status === "present"
                    ? "text-white"
                    : "text-[var(--accent-1)]"
                  )} />
                  Present
                </Button>
              </ChangeClientAttendanceStatus>
              <ChangeClientAttendanceStatus status="absent">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("rounded-full font-bold hover:text-[var(--accent-1)]", client.status === "absent"
                    ? "bg-[var(--accent-2)] hover:bg-[var(--accent-2)] text-white hover:text-white"
                    : "text-[var(--accent-2)] hover:text-[var(--accent-2)] border-[var(--accent-2)]")}
                >
                  <X className={cn(client.status === "absent"
                    ? "bg-white text-[var(--accent-2)] rounded-full p-[2px]"
                    : "bg-[var(--accent-2)] text-white rounded-full p-[2px]"
                  )} />
                  Absent
                </Button>
              </ChangeClientAttendanceStatus>
            </div>
          </div>
        ))}
        {clients.length === 0 && <div className="bg-white border-1 rounded-[6px] h-[200px] flex items-center justify-center font-bold">
          No Matches Found!
        </div>}
      </div>
    </div>
  );
}

export function ChangeClientAttendanceStatus({
  children,
  status
}) {
  async function changeClientAttendanceStatus(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData("app/", { status });
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("app/physical-club/attendance");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    description={`Are you sure of changing the attendance? You are changing the status to ${status}!`}
    action={(setLoading, btnRef) => changeClientAttendanceStatus(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      {children}
    </AlertDialogTrigger>
  </DualOptionActionModal>
}

export function AttendanceCalendar({
  range,
  setRange
}) {
  return (
    <div className="w-full border-1 bg-[var(--comp-1)] p-4 rounded-[10px]">
      <div className=" text-lg font-semibold mb-2">Attendance Calendar</div>
      <Card className="p-4 max-w-sm w-full mx-auto border-1 shadow-none">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={1}
          fixedWeeks
          className="w-full"
        />
        {range?.from && range?.to && (
          <div className="mt-0 text-sm text-gray-600">
            Selected:{" "}
            <span className="font-medium">
              {range.from.toDateString()} - {range.to.toDateString()}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

export function AttendanceSummary() {
  return (
    <Card className="mt-4 p-4">
      <div className="text-sm text-gray-500">Attendance Summary</div>
      <div className="text-sm text-gray-600 mb-2">16 September, 2025</div>
      <div className="flex justify-between text-sm">
        <span>Total Clients:</span>
        <span className="font-semibold">50</span>
      </div>
      <div className="flex justify-between text-sm text-green-600">
        <span>Present Clients:</span>
        <span className="font-semibold">35</span>
      </div>
      <div className="flex justify-between text-sm text-red-600">
        <span>Absent Clients:</span>
        <span className="font-semibold">15</span>
      </div>
    </Card>
  );
}