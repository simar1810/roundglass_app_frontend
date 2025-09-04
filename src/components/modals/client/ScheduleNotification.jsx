import { Textarea } from "@/components/ui/textarea";
import { sendData } from "@/lib/api";
import { format, parse } from "date-fns";
import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import SelectMultiple from "@/components/SelectMultiple";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import useSWR from "swr";
import { retrieveCoachClientList } from "@/lib/fetchers/app";
import Loader from "@/components/common/Loader";
import { useState } from "react";

export default function ScheduleNotificationWrapper({
  children,
  selectedClients,
  defaultPayload = {}
}) {
  const { data, isLoading, error } = useSWR("coach-client-list", () => retrieveCoachClientList())

  if (isLoading) return <Loader />

  if (error || data.status_code !== 200) {
    toast.error(data.message || error || "Something went wrong!")
    return
  }

  const clients = (data.data || []).map((client, index) => ({
    id: index + 1,
    name: client.name,
    value: client._id
  }))

  return <ScheduleNotification
    children={children}
    selectedClients={selectedClients}
    clients={clients}
    defaultPayload={defaultPayload}
  />
}

function formatDate(date) {
  if (!date) return ""
  return format(parse(date, "dd-MM-yyyy", new Date()), "yyyy-MM-dd")
}

function formatTime(timeStr) {
  if (!timeStr.match(/^\d{2}:\d{2}$/) && !timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return "00:00:00"
  const normalized = timeStr.match(/^\d{2}:\d{2}$/)
    ? `${timeStr}:00`
    : timeStr
  const parsed = parse(normalized, "HH:mm:ss", new Date())
  return format(parsed, "HH:mm:ss")
}


function ScheduleNotification({
  children,
  clients,
  selectedClients,
  defaultPayload
}) {
  const [loading, setLoading] = useState(false);

  const [payload, setPayload] = useState({
    subject: defaultPayload.subject || "",
    message: defaultPayload.message || "",
    notificationType: defaultPayload.schedule_type || "schedule", // reocurr, schedule
    time: defaultPayload.time || "", // 24 hrs format
    date: formatDate(defaultPayload.date), // dd-MM-yyyy format
    reocurrence: defaultPayload.reocurrence || [], // 0, 1, ..., 6
    clients: selectedClients || defaultPayload.clients || [],
    actionType: Boolean(defaultPayload?._id) ? "UPDATE" : undefined,
    id: Boolean(defaultPayload?._id) ? defaultPayload._id : undefined
  })

  async function scheduleNotification() {
    const toastId = toast.loading("Please wait...")
    try {
      setLoading(true);
      const formData = generatePayload(payload);
      const response = await sendData(
        `app/notifications-schedule`,
        formData,
        defaultPayload._id ? "PUT" : "POST"
      );
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
      <span>
        {!children && <Button className="font-bold">Schedule</Button>}
        {children}
      </span>
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
        {(!selectedClients || selectedClients?.length <= 0) && <>
          <label className="block mt-4 font-bold">Select Clients</label>
          <SelectMultiple
            label="Select Clients"
            options={clients}
            value={payload.clients}
            onChange={value => setPayload(prev => ({ ...prev, clients: value }))}
            className="mt-1"
            selectAll={true}
          />
        </>}
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
            label="Select Days"
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
            className="mb-4 mt-1"
            selectAll={true}
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
      time: formatTime(payload.time)
    }
  } else if (payload.notificationType === "schedule") {
    if (!payload.date) throw new Error(`date is mandatory.`);
    return {
      subject: payload.subject,
      message: payload.message,
      notificationType: "schedule",
      date: format(parse(payload.date, "yyyy-MM-dd", new Date()), "dd-MM-yyyy"),
      time: formatTime(payload.time),
      clients: payload.clients,
      actionType: payload.actionType,
      id: payload.id
    }
  }
  throw new Error("Type of notification is mandatory.")
}