import { useMemo, useState } from 'react'
import { db, JENIS_MAKAN, type ItemMakan, type JenisMakan, type Makan } from '../db'
import { MAKANAN_UMUM, type MakananUmum } from '../lib/daftar'
import { daftarItem } from '../lib/makan'
import { dariInput, jenisMakanSaatIni, keInputWaktu } from '../lib/tanggal'
import { Ikon } from './Ikon'
import { Field, FotoInput, inputCls, Pilihan, Sheet, Tombol } from './ui'

const RASA = ['Masih lapar', 'Cukup', 'Kenyang', 'Terlalu kenyang'] as const

interface Baris {
  kunci: number
  nama: string
  porsi: string
  jumlah: number
  basis?: number // kalori per 1 porsi dari daftar; kalau ada, kalori mengikuti jumlah
  kalori: string
}

let penghitung = 0
const angka = (s: string) => parseFloat(s.replace(',', '.'))

export default function FormMakan({ awal, waktuAwal, onTutup }: { awal?: Makan; waktuAwal: number; onTutup: () => void }) {
  const [waktu, setWaktu] = useState(keInputWaktu(awal?.waktu ?? waktuAwal))
  const [jenis, setJenis] = useState<JenisMakan>(awal?.jenis ?? jenisMakanSaatIni(waktuAwal))
  const [baris, setBaris] = useState<Baris[]>(() =>
    awal ? daftarItem(awal).map((i) => ({ kunci: ++penghitung, nama: i.nama, porsi: i.porsi, jumlah: 1, kalori: i.kalori?.toString() ?? '' })) : [],
  )
  const [cari, setCari] = useState('')
  const [fokus, setFokus] = useState(false)
  const [rasa, setRasa] = useState(awal?.rasa ?? '')
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')
  const [foto, setFoto] = useState<Blob | undefined>(awal?.foto)
  const [galat, setGalat] = useState('')

  const saran = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return []
    return MAKANAN_UMUM.filter((m) => m.nama.toLowerCase().includes(q)).slice(0, 6)
  }, [cari])

  function tambah(m?: MakananUmum) {
    const nama = (m?.nama ?? cari).trim()
    if (!nama) return
    // Ketikan yang persis sama dengan nama di daftar ikut memakai porsi dan kalorinya.
    const cocok = m ?? MAKANAN_UMUM.find((x) => x.nama.toLowerCase() === nama.toLowerCase())
    setBaris((b) => [
      ...b,
      { kunci: ++penghitung, nama: cocok?.nama ?? nama, porsi: cocok?.porsi ?? '', jumlah: 1, basis: cocok?.kalori, kalori: cocok ? String(cocok.kalori) : '' },
    ])
    setCari('')
    setFokus(false)
    setGalat('')
  }

  function ubah(kunci: number, p: Partial<Baris>) {
    setBaris((b) => b.map((x) => (x.kunci === kunci ? { ...x, ...p } : x)))
  }

  function ubahJumlah(x: Baris, jumlah: number) {
    if (!(jumlah > 0)) return
    ubah(x.kunci, { jumlah, ...(x.basis !== undefined ? { kalori: String(Math.round(x.basis * jumlah)) } : {}) })
  }

  const total = baris.reduce((s, x) => s + (angka(x.kalori) > 0 ? Math.round(angka(x.kalori)) : 0), 0)

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    // Teks yang sudah diketik tapi belum ditekan "Tambah" ikut dimasukkan.
    const semua = [...baris]
    const sisa = cari.trim()
    if (sisa) {
      const cocok = MAKANAN_UMUM.find((x) => x.nama.toLowerCase() === sisa.toLowerCase())
      semua.push({ kunci: ++penghitung, nama: cocok?.nama ?? sisa, porsi: cocok?.porsi ?? '', jumlah: 1, basis: cocok?.kalori, kalori: cocok ? String(cocok.kalori) : '' })
    }
    if (semua.length === 0) return setGalat('Tambahkan minimal satu makanan.')

    const items: ItemMakan[] = semua.map((x) => ({
      nama: x.nama.trim(),
      porsi: x.basis !== undefined && x.jumlah !== 1 ? `${x.jumlah} × ${x.porsi}` : x.porsi.trim(),
      kalori: angka(x.kalori) > 0 ? Math.round(angka(x.kalori)) : undefined,
    }))
    const jumlahKalori = items.reduce((s, i) => s + (i.kalori ?? 0), 0)
    const data: Makan = {
      waktu: dariInput(waktu),
      jenis,
      nama: items.map((i) => i.nama).join(', '),
      porsi: items.length === 1 ? items[0].porsi : `${items.length} item`,
      kalori: jumlahKalori > 0 ? jumlahKalori : undefined,
      items,
      rasa: rasa || undefined,
      catatan: catatan.trim() || undefined,
      foto,
    }
    if (awal?.id) await db.makan.put({ ...data, id: awal.id })
    else await db.makan.add(data)
    onTutup()
  }

  async function hapus() {
    if (awal?.id && confirm('Hapus catatan makan ini?')) {
      await db.makan.delete(awal.id)
      onTutup()
    }
  }

  return (
    <Sheet judul={awal ? 'Ubah catatan makan' : 'Catat makan'} onTutup={onTutup}>
      <form onSubmit={simpan} className="space-y-4">
        <Field label="Waktu">
          <input type="datetime-local" required className={inputCls} value={waktu} onChange={(e) => setWaktu(e.target.value)} />
        </Field>
        <Pilihan nilai={jenis} opsi={JENIS_MAKAN} onChange={setJenis} />

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Apa saja yang dimakan?</span>

          {baris.length > 0 && (
            <ul className="mb-3 space-y-2">
              {baris.map((x) => (
                <li key={x.kunci} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold leading-tight">{x.nama}</div>
                      <input
                        className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 text-sm text-zinc-500 outline-none placeholder:text-zinc-300 focus:border-aksen-300 focus:bg-white focus:px-2"
                        placeholder="porsi (mis. 1 piring)"
                        value={x.porsi}
                        onChange={(e) => ubah(x.kunci, { porsi: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBaris((b) => b.filter((y) => y.kunci !== x.kunci))}
                      className="shrink-0 rounded-full bg-white p-1.5 text-zinc-400 ring-1 ring-zinc-200 active:bg-red-50 active:text-red-500"
                      aria-label={`Hapus ${x.nama}`}
                    >
                      <Ikon nama="tutup" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    {x.basis !== undefined ? (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => ubahJumlah(x, x.jumlah - 0.5)} className="h-8 w-8 rounded-lg bg-white text-lg font-bold ring-1 ring-zinc-200 active:bg-zinc-100" aria-label="Kurangi porsi">
                          −
                        </button>
                        <span className="angka w-10 text-center">{x.jumlah}×</span>
                        <button type="button" onClick={() => ubahJumlah(x, x.jumlah + 0.5)} className="h-8 w-8 rounded-lg bg-white text-lg font-bold ring-1 ring-zinc-200 active:bg-zinc-100" aria-label="Tambah porsi">
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">kalori diisi manual</span>
                    )}
                    <label className="flex items-center gap-1.5 text-sm text-zinc-500">
                      <input
                        inputMode="numeric"
                        className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-right text-base font-bold text-zinc-900 outline-none focus:border-aksen-500"
                        placeholder="0"
                        value={x.kalori}
                        onChange={(e) => ubah(x.kunci, { kalori: e.target.value.replace(/[^\d]/g, ''), basis: undefined })}
                      />
                      kkal
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="relative">
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder={baris.length ? 'Tambah makanan lain…' : 'Ketik, mis. nasi putih'}
                value={cari}
                onChange={(e) => {
                  setCari(e.target.value)
                  setFokus(true)
                }}
                onFocus={() => setFokus(true)}
                onBlur={() => setTimeout(() => setFokus(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    tambah()
                  }
                }}
              />
              <Tombol type="button" warna="abu" onClick={() => tambah()} disabled={!cari.trim()} className="shrink-0">
                Tambah
              </Tombol>
            </div>
            {fokus && saran.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                {saran.map((m) => (
                  <li key={m.nama}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => tambah(m)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left active:bg-zinc-100"
                    >
                      <span>
                        {m.nama} <span className="text-xs text-zinc-500">· {m.porsi}</span>
                      </span>
                      <span className="text-sm text-zinc-500">{m.kalori} kkal</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Pilih dari saran atau ketik sendiri lalu ketuk Tambah. Angka kalori dari daftar hanya perkiraan kasar.</p>
          {galat && <p className="mt-1 text-sm font-medium text-red-600">{galat}</p>}

          {baris.length > 0 && (
            <div className="mt-3 flex items-baseline justify-between rounded-xl bg-malam px-4 py-3 text-white">
              <span className="label-kecil !text-white/60">Total kalori</span>
              <span className="angka text-2xl">
                {total} <span className="text-sm font-semibold text-white/60">kkal</span>
              </span>
            </div>
          )}
        </div>

        <FotoInput foto={foto} onChange={setFoto} />

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Rasa setelah makan</span>
          <div className="flex flex-wrap gap-2">
            {RASA.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRasa(rasa === r ? '' : r)}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${rasa === r ? 'border-aksen-600 bg-aksen-600 text-white' : 'border-zinc-300 bg-white text-zinc-700'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Field label="Catatan">
          <textarea rows={2} className={inputCls} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>

        <div className="flex gap-2 pb-2">
          {awal && (
            <Tombol type="button" warna="merah" onClick={hapus}>
              Hapus
            </Tombol>
          )}
          <Tombol type="submit" className="flex-1">
            Simpan
          </Tombol>
        </div>
      </form>
    </Sheet>
  )
}
