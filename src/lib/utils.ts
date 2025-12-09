import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or Date object to DD Month YYYY format (e.g., "11 December 2026")
 * @param date - Date string or Date object
 * @returns Formatted date string in DD Month YYYY format
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  const day = dateObj.getDate()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = monthNames[dateObj.getMonth()]
  const year = dateObj.getFullYear()
  
  return `${day} ${month} ${year}`
}

/**
 * Formats a date string or Date object to DD-MM-YYYY format
 * @param date - Date string or Date object
 * @returns Formatted date string in DD-MM-YYYY format
 */
export function formatDateNumeric(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}-${month}-${year}`
}

/**
 * Formats a date string or Date object to DD Month YYYY HH:MM format (e.g., "11 December 2026 14:30")
 * @param date - Date string or Date object
 * @returns Formatted date-time string in DD Month YYYY HH:MM format
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  const day = dateObj.getDate()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = monthNames[dateObj.getMonth()]
  const year = dateObj.getFullYear()
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  
  return `${day} ${month} ${year} ${hours}:${minutes}`
}

