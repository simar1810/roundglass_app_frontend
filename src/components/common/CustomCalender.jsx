"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isToday } from "date-fns"

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

// Sample data for badges - you can replace this with your own data
const sampleBadgeData = {
  "2025-09-02": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-03": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-04": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-05": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-06": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-09": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-10": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-11": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-12": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-13": [
    { value: "20", color: "bg-green-500" },
    { value: "2", color: "bg-red-500" },
  ],
  "2025-09-16": [
    { value: "35", color: "bg-green-500" },
    { value: "15", color: "bg-red-500" },
  ],
}

export function CustomCalendar({
  badgeData = sampleBadgeData,
  className,
  onRangeSelect
}) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 16))
  const today = new Date(2025, 8, 16)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const [selectedRange, setSelectedRange] = useState({ from: null, to: null })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const formatDateKey = (date) => {
    return date.toISOString().split("T")[0]
  }

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString()
  }

  const isDateInRange = (date, start, end) => {
    if (!start || !end) return false
    const startDate = start <= end ? start : end
    const endDate = start <= end ? end : start
    return date >= startDate && date <= endDate
  }

  const isDateRangeStart = (date, start, end) => {
    if (!start || !end) return false
    const startDate = start <= end ? start : end
    return isSameDay(date, startDate)
  }

  const isDateRangeEnd = (date, start, end) => {
    if (!start || !end) return false
    const endDate = start <= end ? end : start
    return isSameDay(date, endDate)
  }

  const handleMouseDown = (date) => {
    setIsDragging(true)
    setDragStart(date)
    setDragEnd(date)
  }

  const handleMouseEnter = (date) => {
    if (isDragging) {
      setDragEnd(date)
    }
  }

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const startDate = dragStart <= dragEnd ? dragStart : dragEnd
      const endDate = dragStart <= dragEnd ? dragEnd : dragStart
      const newRange = { from: startDate, to: endDate }
      setSelectedRange(newRange)
      if (onRangeSelect) {
        onRangeSelect(newRange)
      }
    }
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  const renderCalendarDays = () => {
    const days = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = formatDateKey(date)
      const badges = badgeData[dateKey] || []
      const todayClass = isToday(date)

      const isInSelectedRange =
        selectedRange.from && selectedRange.to && isDateInRange(date, selectedRange.from, selectedRange.to)
      const isInDragRange = isDragging && dragStart && dragEnd && isDateInRange(date, dragStart, dragEnd)
      const isRangeStart =
        (selectedRange.from && selectedRange.to && isDateRangeStart(date, selectedRange.from, selectedRange.to)) ||
        (isDragging && dragStart && dragEnd && isDateRangeStart(date, dragStart, dragEnd))
      const isRangeEnd =
        (selectedRange.from && selectedRange.to && isDateRangeEnd(date, selectedRange.from, selectedRange.to)) ||
        (isDragging && dragStart && dragEnd && isDateRangeEnd(date, dragStart, dragEnd))

      days.push(
        <div
          key={day}
          className={cn(
            "h-20 border border-gray-200 p-2 relative flex flex-col cursor-pointer select-none rounded-[6px]",
            todayClass && "border-2 border-green-500 bg-green-50",
            [0, 6].includes(date.getDay()) && "bg-[var(--comp-1)]",
            (isInSelectedRange || isInDragRange) && "bg-blue-100",
            (isRangeStart || isRangeEnd) && "bg-blue-200",
          )}
          onMouseDown={() => handleMouseDown(date)}
          onMouseEnter={() => handleMouseEnter(date)}
          onMouseUp={handleMouseUp}
        >
          <div className="flex flex-col justify-between items-start">
            <span className={cn("text-sm font-medium", todayClass ? "text-green-600" : "text-gray-900")}>{day}</span>
            {todayClass && <span className="text-xs text-green-600 font-medium">Today</span>}
          </div>
          {badges.length > 0 && (
            <div className="flex gap-1 mt-auto">
              {badges.map((badge, index) => (
                <span key={index} className={cn("text-white text-[8px] px-1 py-0.5 rounded font-medium", badge.color)}>
                  {badge.value}
                </span>
              ))}
            </div>
          )}
        </div>,
      )
    }

    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDayOfWeek + daysInMonth)

    for (let i = 0; i < remainingCells; i++) {
      const nextMonthDay = i + 1
      days.push(
        <div key={`next-${i}`} className="h-20 border border-gray-200 p-1">
          <span className="text-sm text-gray-400">{nextMonthDay}</span>
          {nextMonthDay <= 4 && <div className="text-xs text-gray-400 mt-1">June</div>}
        </div>,
      )
    }

    return days
  }

  return (
    <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <Card className={cn("p-6 shadow-none max-w-4xl w-full mx-auto gap-0", className)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {MONTHS[month]}, {year}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} className="h-8 w-8 bg-transparent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 bg-transparent">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-7 mb-0 gap-1">
            {DAYS_OF_WEEK.map((day, index) => (
              <div key={day} className="p-2 text-center">
                <span
                  className={cn("text-xs font-bold", index === 0 || index === 6 ? "text-gray-900" : "text-gray-400")}
                >
                  {day}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
        </div>

        {selectedRange.from && selectedRange.to && (
          <div className="mt-4 text-sm text-gray-600">
            Selected Range:{" "}
            <span className="font-medium">
              {selectedRange.from.toDateString()} - {selectedRange.to.toDateString()}
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}
