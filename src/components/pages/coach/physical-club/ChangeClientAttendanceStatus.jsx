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
      // Format the date properly for the API
      const formattedDate = typeof date === 'string' ? date : date.toISOString();

      // Clear absent status by setting it to unmarked
      const requestData = {
        clientId: clientId,
        date: formattedDate,
        status: "unmarked",
        person: "coach"
      };

      const response = await sendData(
        "app/physical-club/attendance?person=coach",
        requestData,
        "PUT"
      );

      if (response.status_code !== 200) throw new Error(response.message);
    } catch (error) {
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

      const response = await sendData(
        "app/physical-club/attendance?person=coach",
        requestData,
        "PUT"
      );

      if (response.status_code !== 200) throw new Error(response.message);

      if (status === "present") {
        toast.success("New serving added successfully!");
      } else if (status === "absent") {
        toast.success("Attendance marked as absent");
      } else if (status === "requested") {
        toast.success("Attendance request submitted");
      }

      refreshClubHistoryData(clientId);

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
        ? "Are you sure you want to mark this serving as present? This will add a new serving for today."
        : `Are you sure of changing the attendance? You are changing the status to ${status}!`
    }
    action={(setLoading, btnRef) => changeClientAttendanceStatus(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      {children}
    </AlertDialogTrigger>
  </DualOptionActionModal>
}