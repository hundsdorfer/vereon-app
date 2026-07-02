import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vereon',
    short_name: 'Vereon',
    description: 'Vereinsmanagement für Fußballvereine',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f4f6f8',
    theme_color: '#16a34a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
