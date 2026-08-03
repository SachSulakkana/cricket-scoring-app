import type { Metadata } from 'next'
import { Nunito, Oswald, Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CricketProvider } from '@/lib/cricket-context'
import AppToaster from '@/components/AppToaster'
import ApiAuthBridge from '@/components/ApiAuthBridge'
import { AuthProvider } from '@/components/AuthProvider'
import CricketDbProvider from '@/components/CricketDbProvider'
import { ResumePromptProvider } from '@/components/ResumePromptProvider'
import StoreProvider from '@/components/StoreProvider'
import { APP_DESCRIPTION, APP_NAME } from '@/lib/app-brand'
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

const rounded = Nunito({
  subsets: ['latin'],
  variable: '--font-rounded',
  weight: ['600', '700', '800', '900'],
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      {
        url: '/logo.png',
        type: 'image/png',
      },
      {
        url: '/icon-32.png',
        sizes: '32x32',
        type: 'image/png',
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
      className={`dark ${display.variable} ${body.variable} ${rounded.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <StoreProvider>
          <AuthProvider>
            <ApiAuthBridge />
            <CricketProvider>
              <ResumePromptProvider>
                <CricketDbProvider>{children}</CricketDbProvider>
                <AppToaster />
              </ResumePromptProvider>
            </CricketProvider>
          </AuthProvider>
        </StoreProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
