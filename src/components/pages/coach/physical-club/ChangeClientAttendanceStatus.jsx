import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sendData } from "@/lib/api";
import { _throwError } from "@/lib/formatter";
import { toast } from "sonner";
import { refreshAttendanceDataWithDelay, refreshClubHistoryData, refreshAttendanceData } from "@/lib/attendanceUtils";

export default function ChangeClientAttendanceStatus({
  children,
  date,
  status,
  clientId,
  isFirstRecord = false
}) {

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
    } catch (error) {
      console.error("Clear absent status error:", error);
      // Don't show error toast for this, as it's a background operation
    }
  };

  async function changeClientAttendanceStatus(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      
      // If marking present and it's the first record, clear any existing absent status first
      if (isFirstRecord && status === "present") {
        await clearAbsentStatus(clientId, date);
      }
      
      // For first record, use regular creation. For additional records, use "new" type
      const requestData = { 
        status, 
        clientId, 
        date,
        type: isFirstRecord ? undefined : "new" // First record doesn't need "new" type
      };
      
      console.log("Changing attendance status:", requestData);
      
      const response = await sendData(
        "app/physical-club/attendance?person=coach",
        requestData,
        "PUT"
      );
      
      console.log("Attendance status change response:", response);
      
      if (response.status_code !== 200) throw new Error(response.message);
      
      if (status === "present") {
        toast.success("New serving added successfully!");
      } else if (status === "absent") {
        toast.success("Attendance marked as absent");
      } else if (status === "requested") {
        toast.success("Attendance request submitted");
      }
      
      // Refresh both club history and attendance data to update UI
      refreshClubHistoryData(clientId);
      refreshAttendanceDataWithDelay(clientId);
      
      // Additional immediate refresh to ensure UI updates
      setTimeout(() => {
        refreshAttendanceData(clientId);
      }, 100);
      
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <DualOptionActionModal
    description={
      status === "present" 
        ? "Are you sure you want to add a new serving? This will create a new serving record for today."
        : `Are you sure of changing the attendance? You are changing the status to ${status}!`
    }
    action={(setLoading, btnRef) => changeClientAttendanceStatus(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      {children}
    </AlertDialogTrigger>
  </DualOptionActionModal>
}