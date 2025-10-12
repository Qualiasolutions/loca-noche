import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Lora } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Loca Noche Entertainment - Coming Soon",
  description:
    "Nicosia's Premier Arts & Entertainment Experience. Live concerts, cultural events, and exclusive experiences coming soon.",
  keywords: "Loca Noche, entertainment, concerts, Cyprus, Nicosia, live music, events",
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lora.variable} antialiased`}>
      <body className="font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
