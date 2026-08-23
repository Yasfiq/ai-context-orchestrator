"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap border text-sm font-semibold transition-[color,background-color,border-color,transform] duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px aria-[pressed=true]:border-indigo-300 aria-[pressed=true]:bg-primary/20 data-[loading=true]:cursor-wait",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-white hover:border-indigo-500 hover:bg-indigo-600",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:bg-red-500",
        outline:
          "border-border bg-background/30 text-foreground hover:border-muted-foreground hover:bg-surface",
        ghost: "border-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
        success: "border-success bg-success text-slate-950 hover:bg-emerald-400",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "min-h-10 px-3 text-xs",
        lg: "min-h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
