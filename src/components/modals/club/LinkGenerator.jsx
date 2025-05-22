import FormControl from "@/components/FormControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { changeFieldvalue, generateRequestPayload, init, linkGeneratorReducer, resetCurrentState, selectFields, selectMeetingFormField, setCurrentView, setWellnessZLink } from "@/config/state-reducers/link-generator";
import { sendData, sendDataWithFormData } from "@/lib/api";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import { CircleMinus, CirclePlus, Copy } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import ZoomConnectNowModal from "./ZoomConnectNowModal";
import { copyText, getObjectUrl } from "@/lib/utils";
import { mutate } from "swr";
import Image from "next/image";

export default function LinkGenerator({ withZoom, children }) {
  const zoom_doc_id = useAppSelector(state => state.coach.data.zoom_doc_id);
  if (withZoom && !zoom_doc_id) return <ZoomConnectNowModal />

  return <Dialog>
    {children}
    <CurrentStateProvider
      state={init(withZoom)}
      reducer={linkGeneratorReducer}
    >
      <DialogContent className="!max-w-[450px] max-h-[70vh] text-center px-0 border-0 overflow-auto gap-0">
        <MeetingGeneratorContainer withZoom={withZoom} />
      </DialogContent>
    </CurrentStateProvider>
  </Dialog>
}

function MeetingGeneratorContainer({ withZoom }) {
  const { view } = useCurrentStateContext();
  if (view === 1) return <MeetingForm withZoom={withZoom} />
  if ([2, 3].includes(view)) return <MeetingLink />
}

function MeetingLink() {
  const { baseLink, view, wellnessZLink, copyToClipboard, dispatch } = useCurrentStateContext();

  return <>
    <DialogHeader className="mb-4 pb-4 border-b-1">
      <DialogTitle className="px-4">Meeting Link</DialogTitle>
    </DialogHeader>
    <div className="text-left px-4">
      <p className="text-[14px] leading-[1.6] text-left">Say goodbye to loong, complicated links and Say hello to custom WellnessZ integerated meeting links </p>
      <FormControl
        label="Meeting Link"
        value={baseLink}
        onChange={e => dispatch(changeFieldvalue("baseLink", e.target.value))}
        placeholder="Type or paste your link here"
        className="block mt-4"
      />
      {view !== 3 && <>
        <Button
          variant="wz"
          className="block mt-4 mx-auto"
          onClick={() => dispatch(setCurrentView(1))}
        >
          Convert
        </Button>
        <div className="mt-4 flex justify-center gap-2">
          <Switch
            id="meeting-link-switch"
            checked={copyToClipboard}
            onClick={() => dispatch(changeFieldvalue("copyToClipboard", !copyToClipboard))}
          />
          <Label htmlFor="meeting-link-switch">Auto Paste from Clipboard </Label>
        </div>
      </>}
      {view === 3 && <div className="mt-10 mb-32">
        <Label className="font-bold mb-2" htmlFor="wz-link">WellnessZ Link</Label>
        <div className="bg-[var(--accent-1)] flex items-center border-1 rounded-[8px] overflo-clip">
          <div id="wz-link" placeholder="WellnessZ Link" className="bg-[var(--primary-1)]  text-[14px] p-2 rounded-r-none border-0">
            {wellnessZLink}
          </div>
          <div
            onClick={() => {
              copyText(wellnessZLink)
              toast.success("Link Copied!");
            }}
            className="text-white aspect-square rounded-r-[8px] p-[10px] cursor-pointer"
          >
            <Copy />
          </div>
        </div>
        <Button variant="wz" className="block mt-4 mx-auto" onClick={() => dispatch(resetCurrentState())}>New Meeting</Button>
      </div>}
    </div>
  </>
}

async function generateMeeting(withZoom, data, baseLink) {
  if (withZoom) {
    const response = await sendDataWithFormData(`zoom/meeting/schedule?club=${process.env.NEXT_PUBLIC_ZOOM_CLUB_ID}`, data);
    return response;
  } else {
    data.append("baseLink", baseLink);
    const response = await sendDataWithFormData(`generateCustomLink?club=${process.env.NEXT_PUBLIC_ZOOM_CLUB_ID}`, data);
    return response;
  }
}

function MeetingForm({ withZoom }) {
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef();

  const { dispatch, ...state } = useCurrentStateContext();
  const fieldsToBeDisplayed = selectFields(state.meetingType);

  async function createMeeting() {
    try {
      setLoading(true);
      const data = generateRequestPayload(state);
      // throw new Error("Please fill all the fields");
      const response = await generateMeeting(withZoom, data, state.baseLink);
      if (response.status_code !== 200) throw new Error(response.message || response.error);
      toast.success(response.message || "Meeting created successfully!");
      mutate("getMeetings")
      dispatch(setWellnessZLink(response?.data?.wellnessZLink));
      if (state.copyToClipboard) {
        copyText(response?.data?.wellnessZLink);
        toast.success("Link copied");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <DialogHeader className="mb-4 pb-4 border-b-1">
      <DialogTitle className="px-4">Meeting Details</DialogTitle>
    </DialogHeader>
    <div className="text-left px-4">
      {fieldsToBeDisplayed.map(field => selectMeetingFormField(field, state, dispatch))}
      <div className="flex gap-4">
        <Button onClick={() => dispatch(changeFieldvalue("view", 2))} className="grow">Previous</Button>
        <Button
          onClick={createMeeting}
          variant="wz"
          className="grow block mx-auto"
          disabled={loading}
        >
          Create Meeting
        </Button>
      </div>
      <DialogClose ref={closeBtnRef} />
    </div >
  </>
}

export function MeetingType({ field }) {
  const { dispatch, ...state } = useCurrentStateContext();
  return <div className="mb-6">
    <div className="mb-2">Meeting Type</div>
    <div>
      <RadioGroup className="flex items-center gap-6">
        {field.options.map((radio, index) =>
          <div key={radio.id} className="flex items-center gap-1">
            <input
              type="radio"
              id={"meeting-type-" + radio.value}
              onChange={() => dispatch(changeFieldvalue(field.name, radio.value))}
              checked={state.meetingType === radio.value}
            />
            <Label htmlFor={"meeting-type-" + radio.value}>{radio.title}</Label>
          </div>)}
      </RadioGroup>
    </div>
  </div>
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MeetingRepeat({ field }) {
  const { reOcurred, dispatch } = useCurrentStateContext();
  return <div className="mb-4">
    <div className="mb-2">Repeat</div>
    <div className="w-[418px] flex items-center gap-2 overflow-x-auto">
      {days.map((day, index) => <Badge
        variant="wz_fill"
        className={`rounded-full border-0 font-bold cursor-pointer ${!reOcurred.includes(index) && "text-[var(--dark-1)]/25 bg-[var(--comp-1)] opacity-50"}`}
        key={index}
        onClick={reOcurred.includes(index)
          ? () => dispatch(changeFieldvalue(field.name, reOcurred.filter(item => item !== index)))
          : () => dispatch(changeFieldvalue(field.name, [...reOcurred, index]))}
      >
        <span>{day}</span>
        {reOcurred.includes(index)
          ? <CircleMinus className="w-[12px] h-[12px]" />
          : <CirclePlus className="w-[12px] h-[12px]" />}
      </Badge>)}
    </div>
  </div>
}

export function MeetingDescription({ field }) {
  const { dispatch, ...state } = useCurrentStateContext();
  return <div className="mb-4">
    <Label className="mb-2">Meeting Description</Label>
    <Textarea
      {...field}
      value={state[field.name]}
      onChange={e => dispatch(changeFieldvalue(field.name, e.target.value))}
      className="h-[120px]"
    />
  </div>
}

export function MeetingBanner({ field }) {
  const { dispatch, ...state } = useCurrentStateContext();
  const fileRef = useRef();

  return <div className="mb-4">
    <label className="text-[14px]" htmlFor="meeting-banner">{field.label}</label>
    <Image
      src={state.banner ? getObjectUrl(state.banner) : "/not-found.png"}
      height={540}
      width={540}
      alt=""
      className="w-full bg-[var(--comp-1)] mt-2 aspect-video object-contain rounded-md border-1"
      onClick={() => fileRef.current.click()}
      unoptimized
    />
    <input
      ref={fileRef}
      id="meeting-banner"
      type="file"
      hidden
      onChange={e => dispatch(changeFieldvalue(field.name, e.target.files[0]))}
      accept="image/*"
    />
  </div>
}