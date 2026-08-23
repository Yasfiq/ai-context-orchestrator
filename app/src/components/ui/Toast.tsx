"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, CircleAlert, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
  onClose: () => void;
}

const toastStyles = {
  success: "border-success/50 bg-[#10231e] text-foreground",
  error: "border-destructive/60 bg-[#2a1719] text-foreground",
  info: "border-primary/60 bg-[#18182f] text-foreground",
};

const toastIcons = {
  success: Check,
  error: CircleAlert,
  info: Info,
};

export function Toast({ message, type = "info", visible, onClose }: ToastProps) {
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (visible && !paused) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose, paused]);

  if (!visible) return null;

  const Icon = toastIcons[type];

  return (
    <div
      className={cn(
        "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 border px-4 py-3 text-sm shadow-2xl shadow-black/30 animate-slide-up sm:inset-x-auto sm:right-6 sm:max-w-sm",
        toastStyles[type]
      )}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex gap-3 leading-relaxed">
          <Icon className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          {message}
        </span>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-none items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
