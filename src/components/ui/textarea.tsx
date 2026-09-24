import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "glass-field flex min-h-24 w-full rounded-md px-3 py-2 text-sm text-cream placeholder:text-cream-muted/70 outline-none transition-[border-color,box-shadow] duration-[var(--motion-quick)] focus-visible:border-gold/70 focus-visible:ring-2 focus-visible:ring-gold/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
