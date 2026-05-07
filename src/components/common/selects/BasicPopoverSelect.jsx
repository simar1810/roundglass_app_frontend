"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BasicPopoverSelect({
  value,
  onValueChange,
  options,
  selectLabel = "Select One",
  className,
  ...props
}) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      {...props}
    >
      <SelectTrigger className={className}>
        {value
          ? <SelectValue />
          : <>{selectLabel}</>}
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}