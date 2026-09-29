import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Colinha Digital Eleições 2026 MS — Vanildo Neves 70123',
  description: 'Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto para Deputado Estadual Vanildo Neves 70123 e emita sua colinha para impressão e WhatsApp.',
  openGraph: {
    title: 'Colinha Digital Eleições 2026 MS — Vanildo Neves 70123',
    description: 'Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto e emita sua colinha!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Colinha Digital Eleições 2026 MS — Vanildo Neves 70123',
    description: 'Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto e emita sua colinha!',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
