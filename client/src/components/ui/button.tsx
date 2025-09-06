import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--shoplynk-primary)] text-white hover:shadow-hover hover:-translate-y-0.5 shadow-button",
        destructive:
          "bg-[var(--shoplynk-error)] text-white hover:shadow-hover hover:-translate-y-0.5 shadow-button",
        outline:
          "border-2 border-[var(--shoplynk-primary)] bg-transparent text-[var(--shoplynk-primary)] hover:bg-[var(--shoplynk-primary)] hover:text-white",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-button",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
        link: "text-[var(--shoplynk-primary)] underline-offset-4 hover:underline",
        success: "bg-[var(--shoplynk-success)] text-white hover:shadow-hover hover:-translate-y-0.5 shadow-button",
        accent: "bg-[var(--shoplynk-accent)] text-white hover:shadow-hover hover:-translate-y-0.5 shadow-button",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-13 px-8 py-4 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
