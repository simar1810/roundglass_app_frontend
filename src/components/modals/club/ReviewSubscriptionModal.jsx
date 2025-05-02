import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { reviewVPFormControls } from "@/config/data/forms";
import { sendData } from "@/lib/api";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function ReviewSubscriptionModal({ _id }) {
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  async function deleteMeeting() {
    try {
      setLoading(true);
      const response = await sendData(`deleteMeetLink?meetingId=${_id}`, {}, "DELETE");
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      mutate("getMeetings")
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger className="w-full h-8 px-4 py-2 text-[14px] has-[>svg]:px-3 bg-[var(--accent-1)] bg-white text-[var(--accent-1)] border-1 border-[var(--accent-1)] font-semibold rounded-[8px]">
      Review
    </DialogTrigger>
    <DialogContent className="!max-w-[500px] max-h-[65vh] text-center border-0 px-0 overflow-auto gap-0">
      <DialogTitle className="text-[24px]">Review Volume Points</DialogTitle>
      <div className="text-left mt-8 px-4">
        {reviewVPFormControls.map(field => <FormControl
          key={field.id}
          className="[&_.input]:mb-4"
          defaultValue={{}[field.name]}
          {...field}
        />)}
        <h5>Screenshot</h5>
        {true && <Image
          src="/"
          alt=""
          height={400}
          width={400}
          className="w-full max-h-[280px] bg-black mt-2 mb-8"
        />}
        <div className="flex gap-2">
          <Button className="grow" variant="destructive">Reject</Button>
          <Button className="grow" variant="wz">Approve</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
}