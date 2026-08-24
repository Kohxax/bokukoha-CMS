import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "m3-state-layer inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide outline-none transition-[background-color,color,box-shadow] duration-200 disabled:pointer-events-none disabled:cursor-default disabled:opacity-[0.38] focus-visible:ring-ring focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-none",
        destructive:
          "bg-destructive text-white shadow-none focus-visible:ring-destructive/30",
        outline:
          "border border-border bg-transparent text-foreground shadow-none",
        secondary:
          "bg-primary-container text-primary-container-foreground shadow-none",
        tonal:
          "bg-primary-container text-primary-container-foreground shadow-none",
        ghost:
          "bg-transparent text-foreground",
        text:
          "bg-transparent px-3 text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "h-10 px-6 py-2 has-[>svg]:pl-4 has-[>svg]:pr-6",
        "sm": "h-8 gap-1.5 px-4 has-[>svg]:pl-3 has-[>svg]:pr-4",
        "lg": "h-12 px-8 has-[>svg]:pl-6 has-[>svg]:pr-8",
        "icon": "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
