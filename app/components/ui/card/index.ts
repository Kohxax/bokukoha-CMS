import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Card } from "./Card.vue"
export { default as CardAction } from "./CardAction.vue"
export { default as CardContent } from "./CardContent.vue"
export { default as CardDescription } from "./CardDescription.vue"
export { default as CardFooter } from "./CardFooter.vue"
export { default as CardHeader } from "./CardHeader.vue"
export { default as CardTitle } from "./CardTitle.vue"

export const cardVariants = cva(
  "text-card-foreground flex flex-col gap-4 rounded-3xl pb-4",
  {
    variants: {
      variant: {
        filled: "border border-transparent bg-surface-container shadow-none",
        elevated: "border border-transparent bg-surface-container-low shadow-[var(--elevation-1)]",
        outlined: "border border-border bg-surface-container-low shadow-none",
      },
    },
    defaultVariants: {
      variant: "elevated",
    },
  },
)

export type CardVariants = VariantProps<typeof cardVariants>
