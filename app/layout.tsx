import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#1B2A4A',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'VotoFácil — Colinha Digital Eleições 2026 MS (Vanildo Neves 70123)',
  description: 'VotoFácil: Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto para Deputado Estadual Vanildo Neves 70123 e emita sua colinha.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VotoFácil',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'VotoFácil — Colinha Digital Eleições 2026 MS',
    description: 'VotoFácil: Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto e emita sua colinha!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VotoFácil — Colinha Digital Eleições 2026 MS',
    description: 'VotoFácil: Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto e emita sua colinha!',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VotoFácil" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
