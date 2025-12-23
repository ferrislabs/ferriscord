import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, options);
}

export function getStatusColor(
  status: "online" | "offline" | "busy" | "away",
): string {
  switch (status) {
    case "online":
      return "bg-green-400";
    case "offline":
      return "bg-gray-500";
    case "busy":
      return "bg-red-400";
    case "away":
      return "bg-yellow-400";
    default:
      return "bg-gray-500";
  }
}
