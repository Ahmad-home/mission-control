import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mission Control — Dana × Ahmad',
  description: 'Task board and calendar for Dana and Ahmad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
