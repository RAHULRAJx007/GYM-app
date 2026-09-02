import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-full border border-border bg-card px-4 py-2 text-[14px] text-foreground placeholder:text-muted-foreground/60 transition-colors outline-none focus:border-foreground focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:bg-muted file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
