"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface EnhancedLoadingScreenProps {
  onComplete: () => void
}

export function EnhancedLoadingScreen({ onComplete }: EnhancedLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const loadingSteps = [
    "Initializing Platform",
    "Loading Event Data",
    "Preparing Experience",
    "Connecting Systems",
    "Ready to Rock"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 3 + 1
        
        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length)
        setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1))
        
        if (newProgress >= 100) {
          clearInterval(timer)
          setIsComplete(true)
          setTimeout(() => {
            onComplete()
          }, 1000)
          return 100
        }
        return newProgress
      })
    }, 80)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center max-w-md mx-auto px-8">
          {/* Logo with enhanced animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut"
            }}
            className="mb-12"
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Glowing ring */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute inset-0 rounded-full border-2 border-gradient-to-r from-red-500 via-yellow-400 to-red-500 opacity-60"
                style={{
                  background: 'conic-gradient(from 0deg, #ef4444, #eab308, #ef4444)',
                  maskImage: 'linear-gradient(transparent 48%, white 52%)',
                  WebkitMaskImage: 'linear-gradient(transparent 48%, white 52%)'
                }}
              />
              
              {/* Logo container */}
              <div className="absolute inset-2 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10">
                <Image
                  src="/logo.png"
                  alt="Loca Noche Entertainment"
                  width={80}
                  height={80}
                  className="w-20 h-20 drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Brand text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent mb-2">
                LOCA NOCHE
              </h1>
              <div className="h-0.5 w-24 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto rounded-full mb-2" />
              <p className="text-gray-400 text-sm font-medium tracking-widest">
                ENTERTAINMENT
              </p>
            </motion.div>
          </motion.div>

          {/* Progress section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Progress bar */}
            <div className="relative">
              <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-red-600 rounded-full relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Animated shimmer effect */}
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <motion.span
                  key={Math.round(progress)}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-mono"
                >
                  {Math.round(progress)}%
                </motion.span>
                <span>100%</span>
              </div>
            </div>

            {/* Loading status */}
            <div className="text-center">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-white font-medium mb-2"
              >
                {loadingSteps[currentStep]}
              </motion.p>

              {/* Loading dots */}
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Completion message */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pt-4"
                >
                  <p className="text-green-400 font-semibold">
                    ✨ Welcome to the Experience!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="pt-8 border-t border-gray-800/50">
              <p className="text-gray-600 text-xs">
                Cyprus's Premier Entertainment Platform
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}