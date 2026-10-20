import type { ReactNode } from 'react'

const BENTUK: Record<string, ReactNode> = {
  jurnal: <path d="M4 6h16M4 12h16M4 18h10" />,
  progres: (
    <>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </>
  ),
  lainnya: (
    <>
      <path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  makan: <path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18M17 21V3c-2.5 1.5-4 4.5-4 8h4" />,
  olahraga: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  berat: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M8 10a4 4 0 0 1 8 0M12 10l2.5-2.5" />
    </>
  ),
  tidur: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />,
  tambah: <path d="M12 5v14M5 12h14" />,
  kiri: <path d="m15 6-6 6 6 6" />,
  kanan: <path d="m9 6 6 6-6 6" />,
  kamera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  galeri: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-8 8" />
    </>
  ),
  tutup: <path d="M6 6l12 12M18 6 6 18" />,
}

export type NamaIkon = keyof typeof BENTUK

export function Ikon({ nama, className = 'h-5 w-5' }: { nama: NamaIkon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {BENTUK[nama]}
    </svg>
  )
}

// Warna dan ikon per kategori catatan
export const KATEGORI = {
  makan: { ikon: 'makan', warna: 'bg-emerald-500', teks: 'text-emerald-600', lembut: 'bg-emerald-50' },
  olahraga: { ikon: 'olahraga', warna: 'bg-aksen-500', teks: 'text-aksen-600', lembut: 'bg-aksen-50' },
  berat: { ikon: 'berat', warna: 'bg-indigo-500', teks: 'text-indigo-600', lembut: 'bg-indigo-50' },
  tidur: { ikon: 'tidur', warna: 'bg-sky-500', teks: 'text-sky-600', lembut: 'bg-sky-50' },
} as const
