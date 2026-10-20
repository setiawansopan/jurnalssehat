import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, INTENSITAS, kemas, type Intensitas, type Olahraga } from '../db'
import { JENIS_OLAHRAGA } from '../lib/daftar'
import { detailRelevan, METRIK_DETAIL, type KunciDetail } from '../lib/olahraga'
import { dariInput, keInputWaktu } from '../lib/tanggal'
import { Field, FotoInput, inputCls, Pilihan, Sheet, Tombol } from './ui'

const FAKTOR: Record<Intensitas, number> = { Ringan: 0.85, Sedang: 1, Berat: 1.15 }

export default function FormOlahraga({ awal, waktuAwal, onTutup }: { awal?: Olahraga; waktuAwal: number; onTutup: () => void }) {
  const beratTerakhir = useLiveQuery(() => db.berat.orderBy('waktu').last())
  const [waktu, setWaktu] = useState(keInputWaktu(awal?.waktu ?? waktuAwal))
  const [jenis, setJenis] = useState(awal?.jenis ?? JENIS_OLAHRAGA[0].nama)
  const [durasi, setDurasi] = useState(awal?.durasi.toString() ?? '30')
  const [intensitas, setIntensitas] = useState<Intensitas>(awal?.intensitas ?? 'Sedang')
  const [kalori, setKalori] = useState(awal?.kalori?.toString() ?? '')
  const [manual, setManual] = useState(!!awal?.kalori)
  const [detail, setDetail] = useState<Partial<Record<KunciDetail, string>>>(() =>
    Object.fromEntries(METRIK_DETAIL.filter((m) => awal?.[m.kunci] !== undefined).map((m) => [m.kunci, String(awal![m.kunci]).replace('.', ',')])),
  )
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')
  const [foto, setFoto] = useState<Blob | undefined>(awal?.foto)

  const met = JENIS_OLAHRAGA.find((j) => j.nama === jenis)?.met
  useEffect(() => {
    if (manual || !beratTerakhir || !met) return
    const menit = Number(durasi)
    if (menit > 0) setKalori(String(Math.round((met * FAKTOR[intensitas] * beratTerakhir.kg * menit) / 60)))
  }, [manual, beratTerakhir, met, durasi, intensitas])

  // Tampilkan kolom yang relevan untuk jenis ini, ditambah kolom yang sudah terlanjur terisi.
  const relevan = detailRelevan(jenis)
  const tampil = METRIK_DETAIL.filter((m) => relevan.includes(m.kunci) || detail[m.kunci])

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    const data: Olahraga = {
      waktu: dariInput(waktu),
      jenis,
      durasi: Math.round(Number(durasi)),
      intensitas,
      kalori: kalori ? Math.round(Number(kalori)) : undefined,
      catatan: catatan.trim() || undefined,
      foto,
    }
    // put() menimpa seluruh data, jadi kolom yang dikosongkan ikut terhapus.
    for (const m of tampil) {
      const v = parseFloat((detail[m.kunci] ?? '').replace(',', '.'))
      if (!(v > 0)) continue
      const bulat = m.desimal === 0 ? Math.round(v) : Math.round(v * 100) / 100
      data[m.kunci] = m.kunci === 'rpe' ? Math.min(10, Math.max(1, bulat)) : bulat
    }
    const siap = await kemas(data)
    if (awal?.id) await db.olahraga.put({ ...siap, id: awal.id })
    else await db.olahraga.add(siap)
    onTutup()
  }

  async function hapus() {
    if (awal?.id && confirm('Hapus catatan olahraga ini?')) {
      await db.olahraga.delete(awal.id)
      onTutup()
    }
  }

  const adaJenisLama = awal && !JENIS_OLAHRAGA.some((j) => j.nama === awal.jenis)

  return (
    <Sheet judul={awal ? 'Ubah catatan olahraga' : 'Catat olahraga'} onTutup={onTutup}>
      <form onSubmit={simpan} className="space-y-4">
        <Field label="Waktu mulai">
          <input type="datetime-local" required className={inputCls} value={waktu} onChange={(e) => setWaktu(e.target.value)} />
        </Field>
        <Field label="Jenis olahraga">
          <select className={inputCls} value={jenis} onChange={(e) => setJenis(e.target.value)}>
            {adaJenisLama && <option>{awal.jenis}</option>}
            {JENIS_OLAHRAGA.map((j) => (
              <option key={j.nama}>{j.nama}</option>
            ))}
          </select>
        </Field>
        <Field label="Durasi (menit)">
          <input required inputMode="numeric" className={inputCls} value={durasi} onChange={(e) => setDurasi(e.target.value.replace(/[^\d]/g, ''))} />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Intensitas</span>
          <Pilihan nilai={intensitas} opsi={INTENSITAS} onChange={setIntensitas} />
        </div>
        <Field
          label="Kalori terbakar (kkal)"
          hint={
            manual
              ? 'Diisi manual.'
              : beratTerakhir
                ? `Perkiraan otomatis dari berat badan terakhir (${beratTerakhir.kg} kg). Ubah jika punya angka dari jam tangan atau aplikasi lain.`
                : 'Catat berat badan dulu agar perkiraan otomatis tersedia, atau isi manual.'
          }
        >
          <input
            inputMode="numeric"
            className={inputCls}
            value={kalori}
            onChange={(e) => {
              setManual(true)
              setKalori(e.target.value.replace(/[^\d]/g, ''))
            }}
          />
        </Field>
        <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3" open={!!awal && METRIK_DETAIL.some((m) => awal[m.kunci] !== undefined)}>
          <summary className="cursor-pointer select-none text-sm font-bold uppercase tracking-wide text-zinc-700">
            Detail aktivitas <span className="font-normal normal-case text-zinc-500">· opsional</span>
            <span className="mt-0.5 block text-xs font-normal normal-case text-zinc-500">{tampil.slice(0, 4).map((m) => m.pendek.toLowerCase()).join(', ')}</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {tampil.map((m) => (
              <Field key={m.kunci} label={`${m.label}${m.satuan && !m.label.includes('(') ? ` (${m.satuan})` : ''}`}>
                <input
                  inputMode="decimal"
                  className={inputCls}
                  value={detail[m.kunci] ?? ''}
                  onChange={(e) => setDetail({ ...detail, [m.kunci]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Isi yang tersedia saja, misalnya dari jam tangan atau aplikasi lari. Jarak dalam km (500 m = 0,5).</p>
        </details>

        <FotoInput foto={foto} onChange={setFoto} />
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
