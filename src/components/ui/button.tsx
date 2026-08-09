import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-accent-cyan text-bg-app hover:bg-cyan-200",
        secondary: "border border-border-subtle bg-bg-surface-2 text-text-primary hover:border-accent-cyan/50 hover:bg-bg-surface-3",
        ghost: "text-text-secondary hover:bg-bg-surface-2 hover:text-white",
        danger: "border border-status-danger/40 bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white",
      },
      size: { sm: "h-9 px-3 text-xs", md: "h-10 px-4", lg: "h-12 px-5" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
