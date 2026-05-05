import type { Metadata } from 'next'
import { Geist, Geist_Mono, Unbounded, Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
})
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Linkaïa - Where Trust Builds Tomorrow',
  description:
    'Le premier réseau social hybride qui unit les cœurs et les ambitions à travers les frontières.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${unbounded.variable} ${montserrat.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}