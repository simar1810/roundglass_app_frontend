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
  clientId
}) {

  async function changeClientAttendanceStatus(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      
      const requestData = { status, clientId, date };
      
      const response = await sendData(
        "app/physical-club/attendance?person=coach",
        requestData,
        "PUT"
      );
      
      if (response.status_code !== 200) throw new Error(response.message);
      
      if (status === "present") {
        toast.success("Serving marked as present successfully!");
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