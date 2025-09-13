"use client"

import React, { useRef, useState } from "react"
import { format, setHours, setMinutes } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"
import { toast } from "sonner"
import { PopoverClose } from "@radix-ui/react-popover"

export default function TimePicker({ selectedTime, setSelectedTime }) {
  const [hour, setHour] = useState("")
  const [minute, setMinute] = useState("")
  const [period, setPeriod] = useState("AM")

  const closeRef = useRef();

  const handleSetTime = () => {
    if (!hour || !minute) return
    let h = parseInt(hour, 10)
    const m = parseInt(minute, 10)

    if (period === "PM" && h !== 12) h += 12
    if (period === "AM" && h === 12) h = 0

    let date = new Date()
    date = setHours(date, h)
    date = setMinutes(date, m)

    setSelectedTime(format(date, "hh:mm a"))
    closeRef.current.click();
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full mb-2 justify-between">
          {selectedTime || "Select time"}
          <Clock className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min="1"
            max="12"
            placeholder="HH"
            value={hour}
            onChange={(e) => {
              const hour = Number(e.target.value)
              if (isNaN(hour) || hour < 1 || hour > 12) {
                toast.error("Hour must be between 1 and 12")
                return
              }
              setHour(hour)
            }}
            className="w-16 text-center"
          />
          <span className="text-lg">:</span>
          <Input
            type="number"
            min="0"
            max="59"
            placeholder="MM"
            value={minute}
            onChange={(e) => {
              const minutes = Number(e.target.value)
              if (isNaN(minutes) || minutes < 0 || minutes > 59) {
                toast.error("Minutes must be between 0 and 59")
                return
              }
              setMinute(minutes)
            }}
            className="w-16 text-center"
          />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full" onClick={handleSetTime}>
          Set Time
        </Button>
        <PopoverClose ref={closeRef} />
      </PopoverContent>
    </Popover>
  )
}
