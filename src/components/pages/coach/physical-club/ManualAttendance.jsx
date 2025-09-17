"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { manualAttendance } from "@/lib/physical-attendance";
import { endOfMonth, startOfMonth } from "date-fns";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";

export default function ManualAttendance({ data }) {
  const [range, setRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const clients = manualAttendance(data, range)
  console.log(clients)
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
                <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
              </Avatar>
              <span>{client.name}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className={cn("hover:text-[var(--accent-1)]", client.status === true
                  ? "bg-[var(--accent-1)] text-white"
                  : "text-[var(--accent-1)] border-[var(--accent-1)]")}
              >
                Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={cn("hover:text-[var(--accent-1)]", "text-[var(--accent-1)] border-[var(--accent-1)]")}
              >
                Absent
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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