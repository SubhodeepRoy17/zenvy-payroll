import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0]
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function generatePassword(name: string, email: string): string {
  // Generate a memorable password like first 4 letters of name + current year + @
  const firstName = name.split(' ')[0]
  const currentYear = new Date().getFullYear()
  const password = `${firstName.substring(0, 4).toLowerCase()}${currentYear}@`
  return password
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
