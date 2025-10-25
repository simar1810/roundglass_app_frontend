"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { dateWiseAttendanceSplit, getPresentAbsent, manualAttendanceWithRange } from "@/lib/physical-attendance";
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
  const clients = manualAttendanceWithRange(data, range)
    .filter(client => new RegExp(query, "i").test(client?.name))
    console.log("Filtered clients for ManualAttendance:", clients);

  return (<TabsContent value="manual-attendance" className="flex gap-6">
    <AttendanceClients clients={clients} originalData={data} range={range} />
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

export function AttendanceClients({ clients, originalData, range }) {
  console.log("=== DATA LOGGING ===");
  console.log("Clients for ManualAttendance:", clients);
  console.log("Original data:", originalData);
  console.log("Range:", range);
  
  // Group clients by date and clientId to show multiple servings per day
  const groupedClients = clients.reduce((acc, client) => {
    const key = `${client.clientId}-${format(client.date, "yyyy-MM-dd")}`;
    if (!acc[key]) {
      acc[key] = {
        clientId: client.clientId,
        name: client.name,
        profilePhoto: client.profilePhoto,
        date: client.date,
        membership: client.membership, // Store membership data
        servings: []
      };
    }
    
    // Get attendance data from original data for this client
    const clientAttendanceData = originalData.find(origClient => 
      origClient.client?._id === client.clientId
    );
    
    console.log(`\n--- Processing client: ${client.name} (${client.clientId}) ---`);
    console.log("Client attendance data found:", clientAttendanceData);
    
    if (clientAttendanceData && clientAttendanceData.attendance) {
      console.log(`Found ${clientAttendanceData.attendance.length} attendance records for this client`);
      
      // Filter attendance by the specific date
      const clientDateStr = format(client.date, "yyyy-MM-dd");
      const filteredAttendance = clientAttendanceData.attendance.filter(attendance => {
        let attendanceDate;
        if (attendance.date && attendance.date.$date) {
          attendanceDate = new Date(attendance.date.$date);
        } else if (attendance.date) {
          attendanceDate = new Date(attendance.date);
        } else {
          return false;
        }
        
        const attendanceDateStr = format(attendanceDate, "yyyy-MM-dd");
        return attendanceDateStr === clientDateStr;
      });
      
      console.log(`Filtered to ${filteredAttendance.length} records for date ${clientDateStr}`);
      
      // Add filtered attendance data to servings
      filteredAttendance.forEach((attendance, index) => {
        console.log(`Adding attendance ${index} to servings:`, attendance);
        
        acc[key].servings.push({
          ...attendance,
          clientId: client.clientId,
          name: client.name,
          profilePhoto: client.profilePhoto
        });
      });
    } else {
      console.log("No attendance data found, using fallback client data");
      // Fallback to original client data
      acc[key].servings.push(client);
    }
    
    console.log(`Final servings for ${client.name}:`, acc[key].servings);
    
    return acc;
  }, {});

  console.log("\n=== FINAL GROUPED CLIENTS ===");
  console.log("Total groups:", Object.keys(groupedClients).length);
  Object.entries(groupedClients).forEach(([key, group]) => {
    console.log(`\nGroup: ${key}`);
    console.log(`- Client: ${group.name}`);
    console.log(`- Date: ${format(group.date, "yyyy-MM-dd")}`);
    console.log(`- Servings count: ${group.servings.length}`);
    console.log(`- Servings data:`, group.servings);
  });

  const unmarkServing = async (clientId, date, servingNumber) => {
    try {
      // Debug logging
      console.log("Unmarking serving:", { clientId, date, servingNumber });
      
      // Format the date properly for the API
      const formattedDate = typeof date === 'string' ? date : date.toISOString();
      
      // Use the regular attendance API to change status to "unmarked"
      const requestData = {
        clientId: clientId,
        date: formattedDate,
        servingNumber: servingNumber,
        status: "unmarked",
        person: "coach"
      };
      
      console.log("Unmark request data:", requestData);
      
      const response = await sendData(
        "app/physical-club/attendance?person=coach",
        requestData,
        "PUT"
      );
      
      console.log("Unmark API response:", response);
      
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Serving removed successfully");
      // Refresh all attendance-related data with a small delay to ensure backend processing
      refreshAttendanceDataWithDelay(clientId);
    } catch (error) {
      console.error("Unmark serving error:", error);
      toast.error(error.message);
    }
  };

  const clearAbsentStatus = async (clientId, date) => {
    try {
      console.log("Clearing absent status:", { clientId, date });
      
      // Format the date properly for the API
      const formattedDate = typeof date === 'string' ? date : date.toISOString();
      
      // Clear absent status by setting it to unmarked
      const requestData = {
        clientId: clientId,
        date: formattedDate,
        status: "unmarked",
        person: "coach"
      };
      
      console.log("Clear absent request data:", requestData);
      
      const response = await sendData(
        "app/physical-club/attendance?person=coach",
        requestData,
        "PUT"
      );
      
      console.log("Clear absent API response:", response);
      
      if (response.status_code !== 200) throw new Error(response.message);
      console.log("Absent status cleared successfully");
      refreshAttendanceDataWithDelay(clientId);
    } catch (error) {
      console.error("Clear absent status error:", error);
      // Don't show error toast for this, as it's a background operation
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
              <div className="flex items-center gap-2 flex-wrap">
                {/* Always show Absent button */}
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

                {/* Show Present/Add Servings button based on status - prioritize present over absent */}
                {group.servings.some(s => s.status === "present") ? (
                  // If present, show Add Servings button
                  <ChangeClientAttendanceStatus
                    clientId={group.clientId}
                    date={group.date}
                    status="present"
                    isFirstRecord={false}
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
                ) : (
                  // If not present (absent or no attendance), show Present button
                  <ChangeClientAttendanceStatus
                    clientId={group.clientId}
                    date={group.date}
                    status="present"
                    isFirstRecord={true}
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
                )}

                {/* Show Remove buttons only if present and has multiple servings */}
                {group.servings.some(s => s.status === "present") && group.servings.filter(s => s.status === "present").length > 1 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full font-bold hover:text-red-600 text-red-600 border-red-600 hover:border-red-600"
                      onClick={() => {
                        // Remove one present serving from the total count
                        const presentServings = group.servings.filter(s => s.status === "present");
                        if (presentServings.length > 1) {
                          // Find the serving with the highest serving number to remove
                          const sortedServings = presentServings.sort((a, b) => (b.servingNumber || 0) - (a.servingNumber || 0));
                          const servingToRemove = sortedServings[0]; // Get the serving with highest number
                          console.log("Removing serving:", servingToRemove);
                          unmarkServing(group.clientId, servingToRemove.date, servingToRemove.servingNumber || presentServings.length);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Serving
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full font-bold hover:text-red-700 text-red-700 border-red-700 hover:border-red-700"
                      onClick={() => {
                        // Remove all present servings for this day
                        const presentServings = group.servings.filter(s => s.status === "present");
                        console.log("Removing all servings:", presentServings);
                        presentServings.forEach((serving, index) => {
                          setTimeout(() => {
                            unmarkServing(group.clientId, serving.date, serving.servingNumber || index + 1);
                          }, index * 200); // Stagger the requests
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove All ({group.servings.filter(s => s.status === "present").length})
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Show simple count of servings based on status */}
            <div className="ml-12">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">
                  {group.servings.some(s => s.status === "present") ? (
                    <span className="font-medium text-green-600">
                      {group.servings.filter(s => s.status === "present").length} Serving{group.servings.filter(s => s.status === "present").length > 1 ? 's' : ''}
                    </span>
                  ) : group.servings.some(s => s.status === "absent") ? (
                    <span className="font-medium text-red-600">
                      Absent
                    </span>
                  ) : (
                    <span className="font-medium text-gray-500">
                      No attendance marked
                    </span>
                  )}
                </div>
              </div>
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
  const clients = manualAttendanceWithRange(data, {
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