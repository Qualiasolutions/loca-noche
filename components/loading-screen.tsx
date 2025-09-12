"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [loadingText, setLoadingText] = useState("Initializing")

  useEffect(() => {
    const messages = [
      "Initializing",
      "Loading Assets",
      "Preparing Experience",
      "Connecting Systems", 
      "Finalizing"
    ]

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1.5
        
        // Update loading text based on progress
        if (newProgress < 20) setLoadingText(messages[0])
        else if (newProgress < 40) setLoadingText(messages[1])
        else if (newProgress < 60) setLoadingText(messages[2])
        else if (newProgress < 80) setLoadingText(messages[3])
        else if (newProgress < 100) setLoadingText(messages[4])
        
        if (newProgress >= 100) {
          clearInterval(timer)
          setLoadingText("Complete")
          setTimeout(() => {
            setIsVisible(false)
            setTimeout(onComplete, 300)
          }, 600)
          return 100
        }
        return newProgress
      })
    }, 60)

    return () => clearInterval(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center overflow-hidden">
      {/* Professional background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #ef4444 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #eab308 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, rgba(239, 68, 68, 0.05) 50%, transparent 51%)
          `,
          backgroundSize: '100px 100px, 80px 80px, 60px 60px'
        }} />
      </div>

      {/* Subtle animated elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main loading content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-8">
        {/* Professional logo presentation */}
        <div className="mb-12 relative">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-white/5 rounded-full backdrop-blur-sm border border-white/10"></div>
            <div className="absolute inset-4 bg-white/10 rounded-full flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Loca Noche Entertainment"
                width={80}
                height={80}
                className="w-20 h-20 drop-shadow-lg"
                priority
              />
            </div>
          </div>

          {/* Professional brand presentation */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              LOCA NOCHE
            </h1>
            <div className="h-0.5 w-24 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto rounded-full"></div>
            <p className="text-gray-400 text-sm font-medium tracking-widest">
              ENTERTAINMENT
            </p>
          </div>
        </div>

        {/* Professional loading interface */}
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="relative">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-yellow-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>{Math.round(progress)}%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Loading status */}
          <div className="text-center">
            <p className="text-white font-medium mb-1">
              {loadingText}
            </p>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.4s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Professional footer */}
          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-600 text-xs">
              Cyprus's Premier Entertainment Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}