import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'VotoFácil — Colinha Digital Eleições 2026 MS',
    short_name: 'VotoFácil',
    description: 'VotoFácil: Simulador da Urna Eletrônica Eleições 2026 Mato Grosso do Sul. Treine seu voto para Deputado Estadual Vanildo Neves 70123 e emita sua colinha.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#1B2A4A',
    theme_color: '#1B2A4A',
    categories: ['government', 'education', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
