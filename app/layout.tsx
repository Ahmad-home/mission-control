import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mission Control — Dana × Ahmad",
  description: "Task board and calendar for Dana and Ahmad",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: `"Noto Sans Arabic", "Segoe UI", sans-serif` }}>{children}</body>
    </html>
  )
}