"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn("rounded-lg border p-4 [--rdp-cell-size:2.75rem] md:[--rdp-cell-size:3rem]", className)}
      classNames={{
        day: "hover:bg-accent hover:text-accent-foreground",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
