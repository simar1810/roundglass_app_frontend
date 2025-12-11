"use client";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { sendData } from "@/lib/api";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

export default function AddWaterLogModal({ clientId }) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");
  const closeBtnRef = useRef();

  // Format time to HH:mm a format (e.g., "03:29 pm")
  const formatTime = (timeValue) => {
    if (!timeValue) return format(new Date(), "hh:mm a").toLowerCase();
    // If already in HH:mm format (24-hour), convert to hh:mm a (12-hour)
    if (timeValue.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeValue.split(":");
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? "pm" : "am";
      return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return timeValue;
  };

  async function addWaterLog(e) {
    try {
      setLoading(true);
      e.preventDefault();


      const dateString = format(selectedDate, "dd-MM-yyyy");
      const timeString = formatTime(time);

      const data = {
        date: dateString,
        time: timeString
      };

      // Add amount if provided
      if (amount) {
        data.amount = parseFloat(amount);
      }

      const response = await sendData(
        `app/water-log?person=client&clientId=${clientId}`,
        data,
        "POST"
      );

      if (response.status_code !== 200) {
        throw new Error(response.message || "Failed to add water log");
      }

      toast.success(response.message || "Water log added successfully!");
      closeBtnRef.current?.click();
      
      // Reset form
      setSelectedDate(new Date());
      setTime("");
      setAmount("");
      
      // Refresh water log data
      mutate((key) => typeof key === "string" && key.includes("app/water-log"));
    } catch (error) {
      toast.error(error.message || "Failed to add water log");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="bg-[var(--accent-1)] text-white text-[14px] font-bold px-2 py-2 md:py-1 flex items-center gap-1 rounded-[8px]">
        <Plus className="w-[16px]" />
        Add Water Log
      </DialogTrigger>
      <DialogContent className="p-0 max-w-md">
        <DialogHeader className="p-4 border-b-1">
          <DialogTitle>Add Water Log Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={addWaterLog} className="px-4 pb-4 space-y-4">
          <div>
            <label className="font-bold block mb-2">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd-MM-yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="font-bold block mb-2">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Select time"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: HH:mm (24-hour format)
            </p>
          </div>

          <FormControl
            label="Amount (ml)"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in ml (optional)"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-4"
            variant="wz"
          >
            {loading ? "Adding..." : "Add Water Log"}
          </Button>
        </form>
        <DialogClose ref={closeBtnRef} />
      </DialogContent>
    </Dialog>
  );
}

