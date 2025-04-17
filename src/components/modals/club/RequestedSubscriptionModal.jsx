import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { sendData } from "@/lib/api";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import ReviewSubscriptionModal from "./ReviewSubscriptionModal";

export default function RequestedSubscriptionModal({ _id }) {
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
    <DialogTrigger className="h-8 px-4 py-2 text-[14px] has-[>svg]:px-3 bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)] font-semibold rounded-[8px]">
      Requested Subscriptions
    </DialogTrigger>
    <DialogContent className="!max-w-[450px] max-h-[65vh] text-center border-0 px-0 overflow-auto gap-0">
      <DialogTitle className="text-[24px]">Requested Subscriptions</DialogTitle>
      {Array.from({ length: 2 }, (_, i) => i).map(item => <RequestVolumePointCard key={item} />)}
    </DialogContent>
  </Dialog>
}

function RequestVolumePointCard() {
  return <div className="mx-4 py-4 flex items-start gap-4 border-b-1">
    <Avatar className="w-[50px] h-[50px]">
      <AvatarImage src="/" />
      <AvatarFallback>SN</AvatarFallback>
    </Avatar>
    <div className="text-left">
      <p>New Name requested for Subscrition</p>
      <div className="text-[14px] text-[var(--dark-1)]/50 mb-3 flex gap-4">
        <div>Roll No: xyz123</div>
        <div>Amount: 999</div>
        <div>Date 13-11-2024</div>
      </div>
      <ReviewSubscriptionModal />
    </div>
  </div>
}