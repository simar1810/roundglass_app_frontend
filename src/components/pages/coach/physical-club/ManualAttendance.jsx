"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { dateWiseAttendanceSplit, getPresentAbsent, manualAttendanceWithRange, manualAttendanceWithRangeMultiple } from "@/lib/physical-attendance";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { CheckCircle, X, Trash2, Plus } from "lucide-react";
import { CustomCalendar } from "@/components/common/CustomCalender";
import ChangeClientAttendanceStatus from "./ChangeClientAttendanceStatus";
import { endOfMonth, format, startOfMonth } from "date-fns";
import Link from "next/link";
import { sendData } from "@/lib/api";
import { toast } from "sonner";
import { refreshAttendanceDataWithDelay } from "@/lib/attendanceUtils";

export default function ManualAttendance({
  data,
  query,
  range,
  setRange
}) {
  const clients = manualAttendanceWithRangeMultiple(data, range)
    .filter(client => new RegExp(query, "i").test(client?.name))
  // console.log(clients)
  return (<TabsContent value="manual-attendance" className="flex gap-6">
    <AttendanceClients clients={clients} />
    <div className="flex-1">
      <AttendanceCalendar
        range={range}
        data={data}
        setRange={setRange}
      />
      <AttendanceSummary data={data} clients={clients} />
    </div>
  </TabsContent>
  );
}

export function AttendanceClients({ clients }) {
  // Group clients by date and clientId to show multiple servings per day
  const groupedClients = clients.reduce((acc, client) => {
    const key = `${client.clientId}-${format(client.date, "yyyy-MM-dd")}`;
    if (!acc[key]) {
      acc[key] = {
        clientId: client.clientId,
        name: client.name,
        profilePhoto: client.profilePhoto,
        date: client.date,
        servings: []
      };
    }
    acc[key].servings.push(client);
    return acc;
  }, {});

  const unmarkServing = async (clientId, date, servingNumber) => {
    try {
      // Debug logging
      console.log("Unmarking serving:", { clientId, date, servingNumber });

      // Format the date properly for the API
      const formattedDate = typeof date === 'string' ? date : date.toISOString();

      const requestData = {
        clientId: clientId,
        date: formattedDate,
        servingNumber: servingNumber,
        person: "coach"  // Add person parameter like the mark attendance API
      };

      console.log("Unmark request data:", requestData);

      const response = await sendData(
        "app/physical-club/attendance/unmark?person=coach",
        requestData,
        "PATCH"
      );

      console.log("Unmark API response:", response);

      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Serving unmarked successfully");
      // Refresh all attendance-related data with a small delay to ensure backend processing
      refreshAttendanceDataWithDelay(clientId);
    } catch (error) {
      console.error("Unmark serving error:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex-1 space-y-2 bg-[var(--comp-1)] border-1 p-2 rounded-[8px]">
      <div className="mb-4 text-lg font-semibold">
        Total Records <span className="text-gray-500 text-sm">({clients.length})</span>
      </div>
      <div className="space-y-3">
        {Object.values(groupedClients).map((group, i) => (
          <div key={i} className="border-b pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={group.profilePhoto} />
                  <AvatarFallback>{nameInitials(group.name)}</AvatarFallback>
                </Avatar>
                <Link href={`/coach/clients/${group.clientId}?tab=physical-club`}>{group.name}</Link>
                <span className="text-[12px] mt-1">{format(group.date, "dd-MM-yyyy")}</span>
              </div>
              <div className="flex gap-2">
                {/* Show Present/Absent buttons only if no present servings yet */}
                {!group.servings.some(s => s.status === "present") && (
                  <>
                    <ChangeClientAttendanceStatus
                      clientId={group.clientId}
                      date={group.date}
                      status="present"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-bold hover:text-[var(--accent-1)] text-[var(--accent-1)] border-[var(--accent-1)] hover:border-[var(--accent-1)]"
                      >
                        <CheckCircle className="text-[var(--accent-1)]" />
                        Present
                      </Button>
                    </ChangeClientAttendanceStatus>
                    <ChangeClientAttendanceStatus
                      date={group.date}
                      clientId={group.clientId}
                      status="absent"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-bold hover:text-[var(--accent-2)] text-[var(--accent-2)] border-[var(--accent-2)] hover:border-[var(--accent-2)]"
                      >
                        <X className="bg-[var(--accent-2)] text-white rounded-full p-[2px]" />
                        Absent
                      </Button>
                    </ChangeClientAttendanceStatus>
                  </>
                )}

                {/* Show these buttons only if already marked present */}
                {group.servings.some(s => s.status === "present") && (
                  <>
                    {/* Add Serving button */}
                    <ChangeClientAttendanceStatus
                      clientId={group.clientId}
                      type="new"
                      date={group.date}
                      status="present"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-bold hover:text-[var(--accent-1)] text-[var(--accent-1)] border-[var(--accent-1)] hover:border-[var(--accent-1)]"
                      >
                        <Plus className="h-4 w-4" />
                        Add Servings
                      </Button>
                    </ChangeClientAttendanceStatus>

                    {/* Absent button */}
                    <ChangeClientAttendanceStatus
                      date={group.date}
                      clientId={group.clientId}
                      type="new"
                      status="absent"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-bold hover:text-[var(--accent-2)] text-[var(--accent-2)] border-[var(--accent-2)] hover:border-[var(--accent-2)]"
                      >
                        <X className="bg-[var(--accent-2)] text-white rounded-full p-[2px]" />
                        Absent
                      </Button>
                    </ChangeClientAttendanceStatus>

                    {/* Remove Servings button - shows count of present servings */}
                    {group.servings.filter(s => s.status === "present").length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full font-bold hover:text-red-600 text-red-600 border-red-600 hover:border-red-600"
                        onClick={() => {
                          // Remove all present servings for this day
                          const presentServings = group.servings.filter(s => s.status === "present");
                          presentServings.forEach((serving, index) => {
                            setTimeout(() => {
                              // Use group.clientId instead of serving.clientId
                              unmarkServing(group.clientId, serving.date, serving.servingNumber || index + 1);
                            }, index * 200); // Stagger the requests
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Servings ({group.servings.filter(s => s.status === "present").length})
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Show existing servings */}
            <div className="ml-12 space-y-1">
              <span className="text-gray-700 font-bold text-xs">Todays Servings - {group.servings.length}</span>
              {/* {group.servings.map((serving, servingIndex) => (
                <div key={servingIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{serving.servingNumber || servingIndex + 1}</Badge>
                    <Badge
                      variant={serving.status === "present" ? "default" :
                        serving.status === "absent" ? "destructive" :
                          serving.status === "unmarked" ? "secondary" : "outline"}
                      className={serving.status === "unmarked" ? "bg-orange-100 text-orange-700" : ""}
                    >
                      {serving.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {serving.markedAt ? format(new Date(serving.markedAt), "hh:mm a") : "—"}
                    </span>
                  </div>
                  {serving.status === "present" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Delete button clicked for serving:", {
                          clientId: group.clientId,
                          date: serving.date,
                          servingNumber: serving.servingNumber,
                          servingIndex: servingIndex + 1
                        });
                        unmarkServing(group.clientId, serving.date, serving.servingNumber || servingIndex + 1);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))} */}
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

export function AttendanceCalendar({
  data = [],
  range,
  setRange,
}) {
  const clients = manualAttendanceWithRangeMultiple(data, {
    from: startOfMonth(range.from),
    to: endOfMonth(range.from)
  })

  const badgeData = dateWiseAttendanceSplit(clients)
  return (
    <div className="w-full">
      <CustomCalendar
        range={range}
        badgeData={badgeData}
        onRangeSelect={setRange}
        mode="single"
      />
    </div>
  );
}

export function AttendanceSummary({
  data = []
}) {
  return <></>
  const { absent, present, requested } = getPresentAbsent(data)
  return (
    <Card className="mt-4 p-4 gap-0 bg-[var(--comp-1)] shadow-none">
      <div className="pb-2 mb-4 border-b-2 border-[var(--accent-1)] flex items-center justify-between">
        <h2>Attendance Summary</h2>
        {/* <div className="text-sm text-gray-600 mb-2">16 September, 2025</div> */}
      </div>
      <div className="grid grid-cols-2 divide-x-2">
        <div className="flex justify-between text-sm pr-4">
          <span>Total Clients:</span>
          <span className="font-semibold">{data.length}</span>
        </div>
        <div className="pl-4">
          <div className="flex justify-between text-sm text-green-600">
            <span>Present Clients:</span>
            <span className="font-semibold">{present}</span>
          </div>
          <div className="flex justify-between text-sm text-red-600">
            <span>Absent Clients:</span>
            <span className="font-semibold">{absent}</span>
          </div>
          <div className="flex justify-between text-sm text-[#808080]">
            <span>Requested Clients:</span>
            <span className="font-semibold">{requested}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}