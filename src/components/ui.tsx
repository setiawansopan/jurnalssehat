import { useEffect, useRef, useState, type ReactNode } from 'react'
import { kompresFoto } from '../lib/foto'
import { Ikon } from './Ikon'

export function useObjectUrl(blob?: Blob) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export function Foto({ blob, className = '' }: { blob?: Blob; className?: string }) {
  const url = useObjectUrl(blob)
  if (!url) return null
  return <img src={url} alt="" className={`object-cover ${className}`} />
}

export function Sheet({ judul, onTutup, children }: { judul: string; onTutup: () => void; children: ReactNode }) {
  return (
    <div className="no-print fixed inset-0 z-40 flex items-end bg-black/40" onClick={onTutup}>
      <div
        className="pb-aman mx-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <h2 className="judul-sport text-lg">{judul}</h2>
          <button onClick={onTutup} className="rounded-full bg-zinc-100 p-2 text-zinc-600 active:bg-zinc-200" aria-label="Tutup">
            <Ikon nama="tutup" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none focus:border-aksen-500 focus:ring-2 focus:ring-aksen-200'

export function Tombol({
  warna = 'hijau',
  className = '',
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { warna?: 'hijau' | 'abu' | 'merah' }) {
  const w = {
    hijau: 'bg-aksen-500 font-bold text-white shadow-sm shadow-aksen-500/30 active:bg-aksen-600 disabled:bg-aksen-200 disabled:shadow-none',
    abu: 'bg-zinc-100 font-semibold text-zinc-800 active:bg-zinc-200',
    merah: 'bg-red-50 font-semibold text-red-600 active:bg-red-100',
  }[warna]
  return <button {...p} className={`rounded-xl px-4 py-3 ${w} ${className}`} />
}

export function Pilihan<T extends string>({
  nilai,
  opsi,
  onChange,
}: {
  nilai: T
  opsi: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opsi.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full border px-3.5 py-1.5 text-sm ${
            o === nilai ? 'border-aksen-600 bg-aksen-600 text-white' : 'border-zinc-300 bg-white text-zinc-700'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function FotoInput({ foto, onChange }: { foto?: Blob; onChange: (b?: Blob) => void }) {
  const kamera = useRef<HTMLInputElement>(null)
  const galeri = useRef<HTMLInputElement>(null)
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState('')

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setProses(true)
    setGalat('')
    try {
      onChange(await kompresFoto(f))
    } catch {
      setGalat('Foto tidak bisa diproses. Coba foto lain.')
    } finally {
      setProses(false)
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-zinc-700">Foto</span>
      {foto ? (
        <div className="relative">
          <Foto blob={foto} className="h-48 w-full rounded-xl" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
          >
            Hapus foto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Tombol type="button" warna="abu" onClick={() => kamera.current?.click()} disabled={proses}>
            <span className="flex items-center justify-center gap-2"><Ikon nama="kamera" /> Ambil foto</span>
          </Tombol>
          <Tombol type="button" warna="abu" onClick={() => galeri.current?.click()} disabled={proses}>
            <span className="flex items-center justify-center gap-2"><Ikon nama="galeri" /> Dari galeri</span>
          </Tombol>
        </div>
      )}
      {proses && <p className="mt-1 text-xs text-zinc-500">Memproses foto…</p>}
      {galat && <p className="mt-1 text-xs text-red-600">{galat}</p>}
      <input ref={kamera} type="file" accept="image/*" capture="environment" hidden onChange={pilih} />
      <input ref={galeri} type="file" accept="image/*" hidden onChange={pilih} />
    </div>
  )
}
