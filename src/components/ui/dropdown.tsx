'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
  variant?: 'default' | 'navbar'
}

export function Dropdown({ trigger, children, align = 'right', className, variant = 'default' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const dropdownClasses = variant === 'navbar' 
    ? 'navbar-dropdown'
    : 'bg-background'

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-56 rounded-lg border shadow-xl overflow-hidden',
            dropdownClasses,
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          <div className="py-1.5">{children}</div>
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  variant?: 'default' | 'danger' | 'navbar'
}

export function DropdownItem({
  children,
  onClick,
  href,
  className,
  variant = 'default',
}: DropdownItemProps) {
  const baseClasses =
    'block w-full text-left px-4 py-2.5 text-sm transition-all duration-200 cursor-pointer rounded-md mx-1'
  const variantClasses = {
    default: 'hover:bg-muted',
    danger: 'text-destructive hover:bg-destructive/10',
    navbar: 'navbar-dropdown-item',
  }

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseClasses, variantClasses[variant], className)}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

