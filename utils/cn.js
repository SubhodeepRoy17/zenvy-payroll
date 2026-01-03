import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Added missing cn utility file referenced in components.
 * This combines clsx and tailwind-merge for efficient class manipulation.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Re-export cn utility from lib/utils for compatibility from '@/lib/utils'
