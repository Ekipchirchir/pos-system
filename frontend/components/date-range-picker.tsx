"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/calendar"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import { type DateRange } from "react-day-picker"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  setDate?: (date: DateRange | undefined) => void;
}

export default function DateRangePicker({
  className,
  date: externalDate,
  setDate: externalSetDate,
}: DateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(undefined)

  const date = externalDate !== undefined ? externalDate : internalDate;
  const setDate = externalSetDate !== undefined ? externalSetDate : setInternalDate;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-full sm:w-65 lg:w-75 justify-start text-left font-normal text-xs sm:text-sm bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800 hover:text-white",
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400" />
          <span className="truncate">
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span className="text-white">Pick a date range</span>
            )}
          </span>
        </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white text-slate-900 border-slate-200 shadow-2xl rounded-2xl" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            className="p-3 pointer-events-auto text-slate-900"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}