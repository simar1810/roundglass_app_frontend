import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import useSWR from "swr";
import ReviewSubscriptionModal from "./ReviewSubscriptionModal";
import { getRequestSubscriptions } from "@/lib/fetchers/club";
import Loader from "@/components/common/Loader";
import ContentError from "@/components/common/ContentError";

export default function RequestedSubscriptionModal({ _id }) {
  const { isLoading, error, data } = useSWR("getRequestVolumePoints", () => getRequestSubscriptions())

  if (isLoading) return <div>
    <Loader />
  </div>

  const requestedSubscriptions = data.data;
  console.log(requestedSubscriptions)

  return <Dialog>
    <DialogTrigger className="h-8 px-4 py-2 text-[14px] has-[>svg]:px-3 bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)] font-semibold rounded-[8px]">
      Requested Subscriptions
    </DialogTrigger>
    <DialogContent className="!max-w-[450px] max-h-[65vh] text-center border-0 px-0 overflow-auto gap-0">
      {requestedSubscriptions.map(item => <RequestVolumePointCard key={item} />)}
      {data.status_code !== 200 || error && <>
        <DialogTitle className="text-[24px] mb-0">Error</DialogTitle>
        <ContentError title={error || data.message} className="!min-h-[200px] border-0" />
      </>}
      {data.status_code === 200 && !error && <>
        <DialogTitle className="text-[24px]">Requested Subscriptions</DialogTitle>
        {requestedSubscriptions.map(vp => <RequestVolumePointCard
          vp={vp}
          key={vp._id}
        />)}
      </>}
      {requestedSubscriptions.length === 0 && <div className="text-[var(--dark-1)]/50 mb-4">
        <ContentError title="No Subscriptions Requested!" className="!min-h-[200px] border-0" />
      </div>}
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