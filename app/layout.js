
import './globals.css'
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono'
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000'
}

export const metadata = {
  title: 'FIC Hansraj Stock Exchange - Live Trading Simulation',
  description: 'Trade. Compete. Learn — in a live 8-round market simulation with real-time prices and ₹1,00,000 virtual capital.',
  metadataBase: new URL('https://fic-hansraj-stock-exchange.vercel.app'),
  openGraph: {
    title: 'FIC Hansraj Stock Exchange',
    description: 'Live Trading Simulation by Finance & Investment Cell, Hansraj College',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FIC Hansraj Stock Exchange',
    description: 'Live Trading Simulation by Finance & Investment Cell, Hansraj College',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-black text-white min-h-screen overflow-x-hidden antialiased font-sans">
        <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black -z-10" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/20 via-transparent to-transparent -z-10" />
        {children}
      </body>
    </html>
  );
}