import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva('btn-12 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/40', {
  variants: {
    variant: {
      default: '',
      destructive: 'btn-12--destructive',
      outline: 'btn-12--outline',
      secondary: 'btn-12--outline',
      ghost: 'btn-12--ghost',
      link: 'btn-12--link',
    },
    size: {
      default: 'btn-12--md',
      sm: 'btn-12--sm',
      lg: 'btn-12--lg',
      icon: 'btn-12--icon',
      'icon-sm': 'btn-12--icon btn-12--sm',
      'icon-lg': 'btn-12--icon btn-12--lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

function wrapBtn12Label(children: React.ReactNode) {
  return <span className="btn-12__label">{children}</span>
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? children : wrapBtn12Label(children)}
    </Comp>
  )
}

export { Button, buttonVariants }
