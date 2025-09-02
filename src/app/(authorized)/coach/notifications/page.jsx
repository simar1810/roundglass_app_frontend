"use client"
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import SelectMultiple from "@/components/SelectMultiple";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { sendData } from "@/lib/api";
import { getCoachNotifications } from "@/lib/fetchers/app";
import { format, parse } from "date-fns";
import { Bell } from "lucide-react"
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

export default function Page() {
  const [page, setPage] = useState(0);

  const { isLoading, error, data } = useSWR("getCoachNotifications", getCoachNotifications);

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  const notifications = data.data.slice(50 * page, 50 * (page + 1));

  function setNextPage(next) {
    if (next * 50 < data.data.length) setPage(next);
  }

  const types = new Set();
  let index = 0
  for (const notification of data.data) {
    index++;
    types.add(notification.notificationType)
  }

  if (notifications.length === 0) return <div className="">
    <ScheduleNotification />
    <ContentError title="No Notifications found" />
  </div>

  return <div className="content-container">
    <div className="flex items-center justify-between">
      <h4 className="pb-4 mb-4 border-b-1">Notifications</h4>
      <ScheduleNotification />
    </div>
    <div className="grid grid-cols-2 gap-x-4">
      {notifications.map(notification => <Notification
        notification={notification}
        key={notification._id}
      />)}
    </div>
    <NotificationPagination
      page={page}
      setPage={setPage}
      setNextPage={setNextPage}
    />
  </div>
}

function Notification({ notification }) {
  return <div className="max-w-[96ch] px-4 py-3 mb-3 flex items-center gap-6 border-1 border-[var(--accent-1)] rounded-[10px]">
    <Bell fill="#67BC2A" className="min-w-[52px] h-[52px] bg-[#90C844]/30 text-[var(--accent-1)] p-3 rounded-full" />
    <div>
      <h4>{notification.message}</h4>
      {/* <p className="mt-[4px] text-[var(--dark-1)]/25 leading-[1.2] text-[13px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p> */}
      <div className="mt-2 text-[var(--dark-1)]/25 leading-[1.2] text-[13px] font-semibold flex gap-4">
        <p>{notification.createdDate.slice(0, 10)}</p>
        <p>{notification.createdDate.slice(11)}</p>
      </div>
    </div>
  </div>
}

function NotificationPagination({
  page,
  setPage,
  setNextPage
}) {
  return <Pagination>
    <PaginationContent>
      {page > 0 && <PaginationItem onClick={() => setPage(page - 1)}>
        <PaginationPrevious />
      </PaginationItem>}
      <PaginationItem>
        <PaginationLink>{page + 1}</PaginationLink>
      </PaginationItem>
      <PaginationItem onClick={() => setNextPage(page + 1)}>
        <PaginationNext />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
}

function ScheduleNotification() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState({
    subject: "",
    message: "",
    notificationType: "schedule", // reocurr, schedule
    time: "", // 24 hrs format
    date: "", // dd-MM-yyyy format
    reocurrence: [], // 0, 1, ..., 6
  })

  async function scheduleNotification() {
    const toastId = toast.loading("Please wait...")
    try {
      setLoading(true);
      const formData = generatePayload(payload);
      const response = await sendData(`app/notifications-schedule`, formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      location.reload()
    } catch (error) {
      toast.error(error.message);
      toast.dismiss(toastId);
    } finally {
      setLoading(false);
      toast.dismiss(toastId);
    }
  }

  return <Dialog>
    <DialogTrigger asChild>
      <Button className="font-bold">Schedule</Button>
    </DialogTrigger>
    <DialogContent className="max-h-[80vh] items-start overflow-y-auto p-0 gap-0">
      <DialogTitle className="p-4 border-b-1">Notification</DialogTitle>
      <div className="p-4">
        <FormControl
          label="Subject"
          placeholder="Subject"
          value={payload.subject}
          onChange={e => setPayload(prev => ({ ...prev, subject: e.target.value }))}
        />
        <label className="block mt-4 font-bold">Message</label>
        <Textarea
          placeholder="Message"
          value={payload.message}
          onChange={e => setPayload(prev => ({ ...prev, message: e.target.value }))}
          className="mb-4 min-h-[150px]"
        />
        <SelectControl
          label="Notification Type"
          options={[
            { id: 1, name: "Reocurr", value: "reocurr" },
            { id: 2, name: "Schedule", value: "schedule" }
          ]}
          value={payload.notificationType}
          onChange={e => setPayload(prev => ({ ...prev, notificationType: e.target.value }))}
        />
        <FormControl
          label="Time"
          value={payload.time}
          onChange={e => setPayload(prev => ({ ...prev, time: e.target.value }))}
          type="time"
          className="block mt-4"
        />
        {payload.notificationType === "schedule" && <FormControl
          label="Date"
          value={payload.date}
          onChange={e => setPayload(prev => ({ ...prev, date: e.target.value }))}
          type="date"
          className="block mt-4"
        />}
        {payload.notificationType === "reocurr" && <>
          <label className="block mt-4 font-bold">Select Days</label>
          <SelectMultiple
            options={[
              { id: 1, name: "Monday", value: 1 },
              { id: 2, name: "Tuesday", value: 2 },
              { id: 3, name: "Wednesday", value: 3 },
              { id: 4, name: "Thursday", value: 4 },
              { id: 5, name: "Friday", value: 5 },
              { id: 6, name: "Saturday", value: 6 },
              { id: 7, name: "Sunday", value: 0 }
            ]}
            value={payload.reocurrence}
            onChange={value => setPayload(prev => ({ ...prev, reocurrence: value }))}
            className="mb-4"
          />
        </>}
        <Button
          onClick={scheduleNotification}
          disabled={loading}
          variant="wz"
          className="mt-4"
        >Save</Button>
      </div>
    </DialogContent>
  </Dialog>
}

function generatePayload(payload) {
  for (const field of ["subject", "message", "time"]) {
    if (!payload[field]) throw new Error(`${field} is mandatory.`);
  }
  if (payload.notificationType === "reocurr") {
    return {
      ...payload,
      time: `${payload.time}:00`
    }
  } else if (payload.notificationType === "schedule") {
    if (!payload.date) throw new Error(`date is mandatory.`);
    return {
      subject: payload.subject,
      message: payload.message,
      notificationType: "schedule",
      date: format(parse(payload.date, "yyyy-MM-dd", new Date()), "dd-MM-yyyy"),
      time: `${payload.time}:00`,
    }
  }
  throw new Error("Type of notification is mandatory.")
}