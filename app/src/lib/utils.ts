import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { containsPromptInjection } from "./sanitize";

/**
 * Merge Tailwind CSS classes with proper precedence handling.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID for chat messages.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize user input to prevent basic prompt injection patterns.
 * Returns the sanitized string.
 */
export function sanitizeInput(input: string): string {
  const trimmed = input.trim();

  if (trimmed.length === 0) return trimmed;
  if (trimmed.length > 10000) return trimmed.slice(0, 10000);

  return trimmed;
}

/**
 * Check if user input contains potential prompt injection patterns.
 * Returns true if suspicious patterns are detected.
 */
export function detectPromptInjection(input: string): boolean {
  return containsPromptInjection(input);
}

/**
 * Format a timestamp to a human-readable time string.
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
