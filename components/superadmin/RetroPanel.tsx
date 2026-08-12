type RetroPanelProps = {
  title?: string
  subtitle?: string
  children: React.ReactNode
  color?: 'white' | 'yellow' | 'cyan' | 'green' | 'pink'
  className?: string
}

const colors = {
  white: 'bg-white',
  yellow: 'bg-[#FFFFCC]',
  cyan: 'bg-[#CCFFFF]',
  green: 'bg-[#CCFFCC]',
  pink: 'bg-[#FFE6FA]',
}

export default function RetroPanel({
  title,
  subtitle,
  children,
  color = 'white',
  className = '',
}: RetroPanelProps) {
  return (
    <section
      className={`border-4 border-[#061B12] ${colors[color]} shadow-[7px_7px_0_#061B12] ${className}`}
    >
      {(title || subtitle) && (
        <div className="border-b-4 border-[#061B12] bg-[#C0C0C0] px-4 py-3">
          {title && (
            <h2 className="font-mono text-lg font-black uppercase tracking-tight text-[#061B12]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-xs font-bold text-[#063D27]">{subtitle}</p>
          )}
        </div>
      )}

      <div className="p-4">{children}</div>
    </section>
  )
}