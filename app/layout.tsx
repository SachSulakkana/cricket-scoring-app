import type { Metadata } from 'next'
import { Oswald, Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CricketProvider } from '@/lib/cricket-context'
import AppToaster from '@/components/AppToaster'
import CricketDbProvider from '@/components/CricketDbProvider'
import { ResumePromptProvider } from '@/components/ResumePromptProvider'
import StoreProvider from '@/components/StoreProvider'
import './globals.css'

const display = Oswald({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const body = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Cricket Scorer',
  description: 'Ball-by-ball cricket scoring application',
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
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <StoreProvider>
          <CricketProvider>
            <ResumePromptProvider>
              <CricketDbProvider>{children}</CricketDbProvider>
              <AppToaster />
            </ResumePromptProvider>
          </CricketProvider>
        </StoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
