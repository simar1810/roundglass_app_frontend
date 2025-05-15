import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { meetingEditFormControls, meetingEditSelectControls } from "@/config/data/forms";
import { sendData } from "@/lib/api";
import { format, parse } from "date-fns";
import { Pen } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function EditMeetingModal({ meeting }) {
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  async function editMeeting(e) {
    try {
      e.preventDefault();
      setLoading(true);
      const data = {
        baseLink: e.currentTarget.baseLink.value,
        meetingType: e.currentTarget.meetingType.value,
        clubType: e.currentTarget.clubType.value,
        scheduleDate: `${format(parse(e.currentTarget.date.value, "yyyy-mm-dd", new Date()), 'dd-MM-yyyy')} ${e.currentTarget.time.value}:00`,
        time: e.currentTarget.time.value,
        date: e.currentTarget.date.value
      }

      const response = await sendData(`edit-meetingLink?meetingId=${meeting._id}`, data, "PUT");
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      mutate("getMeetings");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger>
      <Pen className="w-[16px]" />
    </DialogTrigger>
    <DialogContent className="!max-w-[450px] max-h-[65vh] border-0 p-0 overflow-auto">
      <DialogHeader className="bg-[var(--comp-2)] py-6 h-[56px] border-b-1">
        <DialogTitle className="text-black text-[20px] ml-5">
          Update Meeting Details
        </DialogTitle>
      </DialogHeader>
      <form className="px-4 pb-8" onSubmit={editMeeting}>
        {meetingEditFormControls.map(field =>
          <FormControl
            key={field.id}
            className="focus:shadow-none [&_.input]:bg-[var(--comp-1)] [&_.input]:mb-4"
            label={field.label}
            placeholder={field.placeholder}
            type={field.type}
            name={field.name}
            defaultValue={field.getvalue(meeting)}
          />
        )}
        {meetingEditSelectControls.map(select => <SelectControl
          className="[&_.input]:mb-4"
          key={select.id}
          options={select.options}
          label={select.label}
          defaultValue={meeting[select.name]}
          name={select.name}
        />)}
        <DialogClose ref={closeBtnRef} className="mt-4 mr-2 py-[8px] px-4 rounded-[8px] border-2">Cancel</DialogClose>
        <Button variant="wz" disabled={loading}>Update</Button>
      </form>
    </DialogContent>
  </Dialog>
}