import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(11,14,13,0.15)] hover:bg-primary/90",
        outline:
          "border-border bg-card hover:bg-muted text-foreground shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-sm",
        lime: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_20px_rgba(214,255,44,0.3)]",
        link: "text-primary underline-offset-4 hover:underline border-0 shadow-none",
      },
      size: {
        default:
          "h-11 gap-2 px-6 text-[14px] has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 text-[13px] rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[52px] gap-2 px-8 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
