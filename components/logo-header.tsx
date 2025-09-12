"use client"

import Image from "next/image"
import Link from "next/link"

interface LogoHeaderProps {
  className?: string
  showText?: boolean
  size?: number
}

export function LogoHeader({ className = "", showText = true, size = 48 }: LogoHeaderProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Glow effect for dark logo visibility */}
        <div className="absolute inset-0 bg-white/20 blur-lg rounded-full scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-red-500/30 blur-md rounded-full"></div>
        
        {/* Logo with enhanced visibility */}
        <div className="relative bg-white/5 backdrop-blur-sm rounded-full p-2">
          <Image
            src="/logo.png"
            alt="Loca Noche Entertainment Logo"
            width={size}
            height={size}
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>
      
      {showText && (
        <div className="text-2xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent drop-shadow-lg">
          LOCA NOCHE
        </div>
      )}
    </Link>
  )
}