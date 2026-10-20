import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Nút chuẩn của toàn ứng dụng.
 *
 * Quy ước:
 *  - default        : hành động chính (nền sáng, chữ tối)
 *  - secondary      : hành động phụ trên nền phụ
 *  - outline        : hành động phụ cần viền
 *  - ghost          : hành động phụ/icon, chỉ đổi nền khi hover
 *  - destructive    : hành động xoá/huỷ nguy hiểm
 *  - accent-soft    : trạng thái đang chọn/nhấn mạnh theo tông accent
 *  - success-soft   : hành động hoàn thành (xanh lá)
 *  - warning-soft   : hành động đang chờ/đang xử lý (vàng)
 *  - danger-soft    : hành động huỷ/xoá nhẹ (đỏ)
 *  - link           : liên kết trong câu
 *  - paper          : nút trên nền giấy trắng (hoá đơn/in)
 *  - paper-primary  : hành động chính trên nền giấy trắng
 *
 * Mọi nút trong app phải dùng component này thay vì <button> + class tự viết.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground hover:bg-accent/90',
        secondary: 'bg-secondary text-foreground hover:bg-secondary/70',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary hover:text-foreground',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        destructive:
          'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/30',
        'accent-soft': 'bg-accent/15 text-accent hover:bg-accent/25',
        'success-soft': 'bg-success/15 text-success hover:bg-success/25',
        'warning-soft': 'bg-warning/15 text-warning hover:bg-warning/25',
        'danger-soft': 'bg-danger/15 text-danger hover:bg-danger/25',
        link: 'text-accent underline-offset-4 hover:underline',
        paper:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        'paper-primary':
          'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400/40',
      },
      size: {
        xs: "h-7 gap-1 rounded-md px-2 text-[11px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-4",
        default: 'h-9 px-4 py-2 text-sm',
        lg: 'h-10 px-6 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': 'size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
