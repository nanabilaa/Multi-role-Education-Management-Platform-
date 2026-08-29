'use client'

import { UserRound } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Avatar({ 
  src, 
  alt = 'Avatar', 
  size = 'md',
  className = '' 
}: AvatarProps) {
  const sizeClass = sizeClasses[size]
  
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/50 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-[#0B513B]/10 flex items-center justify-center text-[#0B513B] font-semibold ring-2 ring-white/50 ${className}`}
    >
      <UserRound className="h-1/2 w-1/2" />
    </div>
  )
}

export { getInitials }
