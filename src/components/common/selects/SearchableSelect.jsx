"use client"
import { Check, ChevronsUpDown } from "lucide-react"
import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SearchableSelect({
  value,
  onValueChange,
  options,
  searchFn,
  selectLabel = "Select One",
  searchPlaceholder,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filteredOptions = useMemo(() => {
    if (typeof searchFn === "function") {
      return options.filter((option) => searchFn(option, query))
    }
    const regex = new RegExp(query, "i")
    return options.filter(option => regex.test(option.label))
  }, [options, searchFn, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find(o => o.value === value)?.label
            : selectLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder ?? selectLabel}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList
            onWheel={(e) => e.stopPropagation()}
            className="w-full max-h-[300px] overflow-y-auto"
          >
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}  
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}