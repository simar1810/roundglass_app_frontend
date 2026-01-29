import FormControl from "@/components/FormControl";
import UpdateCoachAboutModal from "@/components/modals/coach/UpdateCoachAboutModal";
import UpdateCoachSpecializationModal from "@/components/modals/coach/UpdateCoachSpecializationModal";
import UpdatePersonalDetails from "@/components/modals/coach/UpdateDetailsModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { coachPortfolioFields } from "@/config/data/ui";
import { getPersonalBranding } from "@/lib/fetchers/app";
import { sendData } from "@/lib/api";
import { _throwError } from "@/lib/formatter";
import { copyText } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { format, parse } from "date-fns";
import {
  Clipboard,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import DeleteClientNudges from "../client/DeleteClientNudges";

const COACH_WEBSITE_BASE_LINK = "https://coaches.wellnessz.in"

export default function CoachDetailsCard({ coachData }) {
  const { coachId, coachRefUrl } = useAppSelector(state => state.coach.data);
  const { data: brandData } = useSWR("app/personalBranding", getPersonalBranding);

  const brandName = brandData?.data?.[0]?.brandName || "WellnessZ";

  const messageTimings = coachData.messageTimings ?? {};

  function copyInviteLink() {
    // Use coachRefUrl if available, otherwise fallback to wellnessz.in
    // Remove trailing slashes to avoid double slashes
    const baseUrl = (coachRefUrl || "https://roundglass.com/app").replace(/\/+$/, "");
    const inviteUrl = `${baseUrl}/coachCode?coachID=${coachId}`;

    copyText(`Hey! 👋

I just joined *${brandName}*, an amazing wellness & coaching app 💚

Register now using my link and let's begin your health journey together 💪👇
${inviteUrl}`)
    toast.success("Invite Link copied")
  }

  return <Card className="bg-white rounded-[18px] shadow-sm border-1">
    <CardHeader className="relative flex items-start gap-4 md:gap-8 pb-6">
      <Avatar className="w-[100px] h-[100px] border-2 border-[var(--accent-1)]">
        <AvatarImage src={coachData.profilePhoto} />
        <AvatarFallback>SN</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h4 className="text-2xl font-bold mb-2">{coachData.name}</h4>
        <p className="text-[14px] text-[var(--dark-2)] font-semibold leading-[1] flex items-center gap-2">
          <Button
            onClick={() => {
              copyText(coachId)
              toast.success("Coach ID copied")
            }}
            variant="icon"
            className="text-[var(--accent-1)] h-auto py-0"
          >
            <Clipboard className="w-[20px] h-[20px]" strokeWidth={3} />
          </Button>
          ID #{coachData.coachId}
        </p>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <h4 className="text-lg font-semibold">About</h4>
        <UpdateCoachAboutModal defaultValue={coachData.about} />
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.5] pb-6 border-b border-slate-200">{coachData.about}</p>

      <div className="flex items-center justify-between pb-2">
        <h4 className="text-lg font-semibold">Specialization</h4>
        <UpdateCoachSpecializationModal defaultValue={coachData.specialization} />
      </div>
      <p className="text-[14px] text-[var(--dark-2)] leading-[1.5] pb-6 border-b border-slate-200">{coachData.specialization}</p>

      <div className="flex items-center justify-between pb-2">
        <h4 className="text-lg font-semibold">Personal Information</h4>
        <UpdatePersonalDetails coachData={coachData} />
      </div>
      <div className="pl-4 pb-6 border-b border-slate-200">
        {coachPortfolioFields.map(field => <div key={field.id} className="text-[14px] mb-2 grid grid-cols-4 items-center gap-2">
          <p className="font-medium">{field.title}</p>
          <p className="text-[var(--dark-2)] col-span-3">:&nbsp;{coachData[field.name] || "—"}</p>
        </div>)}
      </div>

      <div className="flex items-center justify-between pb-2">
        <h4 className="text-lg font-semibold">Coach Timings</h4>
        <UpdateCoachTimingsModal messageTimings={coachData.messageTimings} />
      </div>
      <div className="pl-4 pb-6 border-b border-slate-200">
        <div className="text-[14px] mb-2 grid grid-cols-4 items-center gap-2">
          <p className="font-medium">Opening Time</p>
          <p className="text-[var(--dark-2)] col-span-3">:&nbsp;{messageTimings.openingTime || "—"}</p>
        </div>
        <div className="text-[14px] mb-2 grid grid-cols-4 items-center gap-2">
          <p className="font-medium">Closing Time</p>
          <p className="text-[var(--dark-2)] col-span-3">:&nbsp;{messageTimings.closingTime || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pb-2">
        <h4 className="text-lg font-semibold">Portfolio Website</h4>
        <Link
          target="_blank"
          href={`${COACH_WEBSITE_BASE_LINK}/${coachData.coachId}`}
          className="bg-[var(--accent-1)] text-white text-[14px] font-bold px-4 py-2 flex items-center gap-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Link2 className="w-4 h-4" />
          Explore Portfolio
        </Link>
      </div>

      <div className="flex items-center justify-between pb-2">
        <h4 className="text-lg font-semibold">Invite Link</h4>
        <Button
          variant="wz"
          className="w-auto h-auto py-2 px-4 !font-bold gap-2 rounded-lg"
          onClick={copyInviteLink}
        >
          <Link2 className="w-4 h-4" />
          Invite Link
        </Button>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h4 className="text-lg font-semibold">Delete All Client Nudges</h4>
        <DeleteClientNudges description="Are you sure you want to delete all notifications for all clients?">
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
        </DeleteClientNudges>
      </div>
    </CardContent>
  </Card>
}

function to24HourFormat(timeStr) {
  if (!timeStr?.trim()) return ""
  try {
    const parsedTime = parse(timeStr.trim(), "hh:mm a", new Date())
    return format(parsedTime, "HH:mm")
  } catch (error) {
    return ""
  }
}

function to12HourFormat(timeStr) {
  if (!timeStr?.trim()) return ""
  try {
    const parsedTime = parse(timeStr.trim(), "HH:mm", new Date())
    return format(parsedTime, "hh:mm a")
  } catch {
    return ""
  }
}

function UpdateCoachTimingsModal({ messageTimings = {} }) {
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState({
    openingTime: to24HourFormat(messageTimings.openingTime),
    closingTime: to24HourFormat(messageTimings.closingTime)
  })

  const closeBtnRef = useRef()

  async function udpateTimings() {
    try {
      setLoading(true);
      const response = await sendData("app/chat-timings", {
        openingTime: to12HourFormat(payload.openingTime),
        closingTime: to12HourFormat(payload.closingTime),
      });
      if (response.status_code !== 200) _throwError(response.message);
      toast.success(response.message);
      mutate("coachProfile");
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger asChild>
      <Button
        size="sm"
        variant="wz"
      >Edit</Button>
    </DialogTrigger>
    <DialogContent className="p-0 max-h-[70vh] overflow-y-auto">
      <DialogClose ref={closeBtnRef} />
      <DialogTitle className="border-b-1 p-4">Coach Timings</DialogTitle>
      <div className="p-4 pt-0">
        <FormControl
          type="time"
          value={payload.openingTime}
          className="mb-4 block"
          onChange={e => setPayload(prev => ({
            ...prev,
            openingTime: e.target.value
          }))}
        />
        <FormControl
          type="time"
          value={payload.closingTime}
          onChange={e => setPayload(prev => ({
            ...prev,
            closingTime: e.target.value
          }))}
        />
        <Button
          className="mt-4"
          variant="wz"
          disabled={loading}
          onClick={udpateTimings}
        >Save</Button>
      </div>
    </DialogContent>
  </Dialog>
}
