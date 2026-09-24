import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "glass-field flex h-11 w-full rounded-md px-3 text-sm text-cream placeholder:text-cream-muted/70 outline-none transition-[border-color,box-shadow] duration-[var(--motion-quick)] focus-visible:border-gold/70 focus-visible:ring-2 focus-visible:ring-gold/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
