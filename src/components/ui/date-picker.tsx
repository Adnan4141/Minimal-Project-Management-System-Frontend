"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerInputProps {
  value: string | Date | null
  onChange: (date: string) => void
  placeholder?: string
  minDate?: string | Date
  maxDate?: string | Date
  required?: boolean
  className?: string
  disabled?: boolean
  showIcon?: boolean
  dateFormat?: string
  id?: string
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  required = false,
  className,
  disabled = false,
  showIcon = true,
  dateFormat = 'yyyy-MM-dd',
  id,
}: DatePickerInputProps) {
  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : undefined
  const minDateValue = minDate ? (typeof minDate === 'string' ? new Date(minDate) : minDate) : undefined
  const maxDateValue = maxDate ? (typeof maxDate === 'string' ? new Date(maxDate) : maxDate) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange('')
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          {showIcon && (
            <CalendarIcon className="mr-2 h-4 w-4" />
          )}
          {dateValue ? (
            format(dateValue, dateFormat === 'yyyy-MM-dd' ? 'PPP' : dateFormat)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          captionLayout="dropdown"
          fromYear={minDateValue ? minDateValue.getFullYear() : 1900}
          toYear={maxDateValue ? maxDateValue.getFullYear() : new Date().getFullYear() + 10}
          disabled={(date) => {
            if (disabled) return true
            if (minDateValue && date < minDateValue) return true
            if (maxDateValue && date > maxDateValue) return true
            return false
          }}
          required={required}
          className="rounded-lg border"
        />
      </PopoverContent>
    </Popover>
  )
}
