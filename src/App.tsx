import { useState } from 'react'
import type { Berat, Makan, Olahraga } from './db'
import FormBerat from './components/FormBerat'
import FormMakan from './components/FormMakan'
import FormOlahraga from './components/FormOlahraga'
import HariIni from './components/HariIni'
import { Ikon, KATEGORI, type NamaIkon } from './components/Ikon'
import Lainnya from './components/Lainnya'
import Progres from './components/Progres'
import { Sheet } from './components/ui'
import { awalHari } from './lib/tanggal'

type Tab = 'hari' | 'progres' | 'lainnya'
type Form =
  | { tipe: 'makan'; data?: Makan }
  | { tipe: 'olahraga'; data?: Olahraga }
  | { tipe: 'berat'; data?: Berat }

const TAB: { id: Tab; ikon: NamaIkon; label: string }[] = [
  { id: 'hari', ikon: 'jurnal', label: 'Jurnal' },
  { id: 'progres', ikon: 'progres', label: 'Progres' },
  { id: 'lainnya', ikon: 'lainnya', label: 'Lainnya' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('hari')
  const [hari, setHari] = useState(Date.now())
  const [form, setForm] = useState<Form>()
  const [menuTambah, setMenuTambah] = useState(false)

  // Waktu bawaan form: kalau sedang melihat hari lain, pakai hari itu pada jam sekarang.
  const waktuBaru = () => {
    const sekarang = new Date()
    return awalHari(hari) + (sekarang.getTime() - awalHari(sekarang))
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <header className="pt-aman sticky top-0 z-30 bg-malam text-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-aksen-500">
            <Ikon nama="olahraga" className="h-4 w-4" />
          </span>
          <h1 className="judul-sport text-lg">
            Jurnal <span className="text-aksen-500">Sehat</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-3">
        {tab === 'hari' && (
          <HariIni
            hari={hari}
            setHari={setHari}
            edit={{
              makan: (data) => setForm({ tipe: 'makan', data }),
              olahraga: (data) => setForm({ tipe: 'olahraga', data }),
              berat: (data) => setForm({ tipe: 'berat', data }),
            }}
          />
        )}
        {tab === 'progres' && <Progres />}
        {tab === 'lainnya' && <Lainnya />}
      </main>

      {tab === 'hari' && (
        <button
          onClick={() => setMenuTambah(true)}
          className="no-print fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-aksen-500 text-white shadow-lg shadow-aksen-500/40 active:scale-95 active:bg-aksen-600"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Tambah catatan"
        >
          <Ikon nama="tambah" className="h-7 w-7" />
        </button>
      )}

      <nav className="no-print pb-aman fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-lg">
          {TAB.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold uppercase tracking-wide ${
                tab === t.id ? 'text-aksen-600' : 'text-zinc-400'
              }`}
            >
              {tab === t.id && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-aksen-500" />}
              <Ikon nama={t.ikon} className="h-6 w-6" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {menuTambah && (
        <Sheet judul="Catat apa?" onTutup={() => setMenuTambah(false)}>
          <div className="grid gap-2 pb-2">
            {(
              [
                ['makan', 'Makan / minum', 'Foto, porsi, kalori'],
                ['olahraga', 'Olahraga', 'Durasi, intensitas, foto'],
                ['berat', 'Berat & komposisi', 'Berat, lemak, otot, dll.'],
              ] as const
            ).map(([tipe, label, sub]) => (
              <button
                key={tipe}
                onClick={() => {
                  setMenuTambah(false)
                  setForm({ tipe })
                }}
                className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-3.5 text-left active:bg-zinc-100"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${KATEGORI[tipe].warna}`}>
                  <Ikon nama={KATEGORI[tipe].ikon} className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-bold">{label}</span>
                  <span className="block text-sm text-zinc-500">{sub}</span>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {form?.tipe === 'makan' && <FormMakan awal={form.data} waktuAwal={waktuBaru()} onTutup={() => setForm(undefined)} />}
      {form?.tipe === 'olahraga' && <FormOlahraga awal={form.data} waktuAwal={waktuBaru()} onTutup={() => setForm(undefined)} />}
      {form?.tipe === 'berat' && <FormBerat awal={form.data} waktuAwal={waktuBaru()} onTutup={() => setForm(undefined)} />}
    </div>
  )
}
