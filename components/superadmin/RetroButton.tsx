import Link from 'next/link'

type RetroButtonProps = {
  children: React.ReactNode
  href?: string
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  variant?: 'green' | 'pink' | 'yellow' | 'gray' | 'danger'
  className?: string
}

const variants = {
  green: 'bg-[#00CC99] text-[#061B12]',
  pink: 'bg-[#FF3CC7] text-white',
  yellow: 'bg-[#FFF8A8] text-[#061B12]',
  gray: 'bg-[#C0C0C0] text-[#061B12]',
  danger: 'bg-[#FF3B30] text-white',
}

const baseClass =
  'inline-flex items-center justify-center gap-2 border-2 border-[#061B12] px-4 py-2 text-sm font-black shadow-[3px_3px_0_#061B12] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60'

export default function RetroButton({
  children,
  href,
  type = 'button',
  onClick,
  disabled,
  variant = 'green',
  className = '',
}: RetroButtonProps) {
  const classes = `${baseClass} ${variants[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}