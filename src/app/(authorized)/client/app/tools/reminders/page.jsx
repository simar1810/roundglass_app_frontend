"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import NoData from "@/components/common/NoData";
import ReminderModal from "@/components/modals/tools/ReminderModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DialogTrigger } from "@/components/ui/dialog";
import { addRemainder, getReminders } from "@/lib/fetchers/app";
import { nameInitials } from "@/lib/formatter";
import { format, parse, set, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { PenLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
const dates = generateDatesPayload();

export default function Page() {
  const { isLoading, error, data } = useSWR("app/getAllReminder?person=coach", () => getReminders("client"));
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "dd-MM-yyyy"));
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    topic: "",
    agenda: "",
    date: "",
    time: ""
  });
  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const selectedDateFormat = format(parse(selectedDate, 'dd-MM-yyyy', new Date()), 'yyyy-MM-dd');

  function formatTimeToAMPM(time) {
    if (!time) return "";
    let [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  }

  const reminders = data.data.filter(reminder => reminder.date === selectedDate || reminder.date === selectedDateFormat)
  const handleSubmit = async () => {
    try {
      const formattedTime = formatTimeToAMPM(form.time);
      const payload = {
      ...form,
      time: formattedTime
      };
      const res = await addRemainder(payload)
      if (res && res?.status_code === 200) {
        toast.success(res?.message);
        return;
      }
      toast.error(res?.message || "Failed to add remainder");
      setOpenModal(false);        
    } catch (error) {
      toast.error("Internal Server Error");
      console.error("Internal Server Error", error);
    }
  };
 const modal = openModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
    <div className="bg-white w-[90%] max-w-lg rounded-2xl p-6 shadow-2xl border border-gray-200 animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-semibold text-gray-800">Add Reminder</h2>
        <button
          onClick={() => setOpenModal(false)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1 text-gray-600">Topic</label>
          <input
            type="text"
            placeholder="Enter topic..."
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--accent-1)] outline-none transition"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1 text-gray-600">Agenda</label>
          <textarea
            placeholder="Describe your agenda..."
            value={form.agenda}
            onChange={(e) => setForm({ ...form, agenda: e.target.value })}
            className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--accent-1)] outline-none transition min-h-[80px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-600">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--accent-1)] outline-none transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-gray-600">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--accent-1)] outline-none transition"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setOpenModal(false)}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-[var(--accent-1)] text-white transition shadow-md"
          >
            Save
          </button>
        </div>

      </div>

    </div>
  </div>
);


  if (reminders.length === 0) return <div className="content-container content-height-screen flex flex-col items-center justify-center">
    {modal}
    <div className="flex justify-start gap-4 md:gap-10 items-center w-full">
      <NotesPageHeader />
      <button
        onClick={() => setOpenModal(true)}
        className="px-4 mb-4 w-[12vw] py-2 rounded-xl bg-green-400 text-white"
      >
        Add Reminder
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
      <div className="my-auto">
        <NoData message="No Reminders Available" />
      </div>
      <DatesListing
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      />
    </div>
  </div>

  return <div className="content-container content-height-screen overflow-y-auto no-scrollbar">
    {modal}
    <div className="flex justify-start gap-4 md:gap-10 items-center w-full">
      <NotesPageHeader />
      <button
        onClick={() => setOpenModal(true)}
        className="px-2 md:px-4 w-[40vw] md:w-[12vw] text-xs md:text-sm py-2 rounded-xl bg-green-400 text-white"
      >
        Add Reminder
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
     <RemindersListing reminders={reminders} />
    <DatesListing
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
    />
    </div>
  </div>
}

function NotesPageHeader() {
  return <div className="flex items-center gap-4">
    <h4 className="">Reminders</h4>
  </div>
}

function DatesListing({ selectedDate, setSelectedDate }) {
  const current = parse(selectedDate, "dd-MM-yyyy", new Date());
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const rows = [];
  let day = startDate;
  while (day <= endDate) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const formatted = format(day, "dd-MM-yyyy");
      const same = isSameDay(day, parse(selectedDate, "dd-MM-yyyy", new Date()));
      const today = isToday(day);
      week.push(
        <div
          key={day}
          onClick={() => setSelectedDate(formatted)}
          className={`
            h-12 flex items-center justify-center cursor-pointer rounded-lg 
            transition-all

            ${same ? "bg-[var(--accent-1)] text-white font-semibold shadow-md" : ""}
            ${today && !same ? "border border-[var(--accent-1)] text-[var(--accent-1)] font-semibold" : ""}
            ${!same && !today ? "hover:bg-gray-100" : ""}
          `}
        >
          {format(day, "d")}
        </div>
      );

      day = addDays(day, 1);
    }
    rows.push(
      <div key={day} className="grid grid-cols-7 gap-1">
        {week}
      </div>
    );
  }
  return (
    <div className="p-4 inset-5 shadow-inner rounded-2xl h-[55vh] border bg-zinc-50 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">
          {format(current, "MMMM yyyy")}
        </h2>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-2">
        <p>Mon</p><p>Tue</p><p>Wed</p><p>Thu</p><p>Fri</p><p>Sat</p><p>Sun</p>
      </div>
      <div className="space-y-2">{rows}</div>
    </div>
  );
}

function RemindersListing({ reminders }) {
  return (
    <div className="mt-10 relative h-[470px] overflow-y-auto no-scrollbar">
      <div className="absolute hidden md:block md:left-28 top-0 bottom-0 w-[2px] bg-[var(--accent-1)]/40" />
      <div className="space-y-4 md:space-y-10">
        {reminders.map((reminder) => (
          <Reminder key={reminder._id} reminder={reminder} />
        ))}
      </div>
    </div>
  );
}

function Reminder({ reminder }) {
  return (
    <div className="flex items-start gap-4 md:gap-6 relative md:w-[40vw]">
      <div className="md:w-20 text-right md:pr-4">
        <p className="font-semibold text-gray-700">{reminder.time}</p>
      </div>
      <div className="relative hidden md:block">
        <div className="w-4 h-4 rounded-full bg-[var(--accent-1)] shadow-md"></div>
      </div>
      <div className="flex-1 bg-white shadow-md rounded-xl px-5 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm md:text-lg font-semibold text-[var(--accent-1)]">
              {reminder.agenda}
            </p>
            <p className="text-xs md:text-sm text-gray-600">{reminder.topic}</p>
          </div>
          <ReminderModal type="UPDATE" payload={reminder}>
            <DialogTrigger>
              <PenLine className="w-4 h-4" />
            </DialogTrigger>
          </ReminderModal>
        </div>
        <div className="mt-3">
          <Avatar>
            <AvatarFallback>
              {nameInitials(reminder.client.name || "N A")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

function generateDatesPayload() {
  const dates = [];
  for (let i = -15; i < 15; i++) {
    dates.push({
      id: 16 + i,
      date: format(addDays(new Date(), i), 'dd-MM-yyyy'),
      day: format(addDays(new Date(), i), 'E'),
    })
  }
  return dates;
}