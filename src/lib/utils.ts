import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Environment variable utilities
export function getResendApiKey(): string {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_RESEND_API_KEY environment variable is not set");
  }
  return apiKey;
}

export function getFromEmail(): string {
  return import.meta.env.VITE_FROM_EMAIL || "noreply@yourdomain.com";
}
