import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SlideFlow - Practice Your Presentations',
  description: 'Enhance your presentation delivery with SlideFlow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
