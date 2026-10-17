import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, INTENSITAS, kemas, type Intensitas, type Olahraga } from '../db'
import { JENIS_OLAHRAGA } from '../lib/daftar'
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
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')
  const [foto, setFoto] = useState<Blob | undefined>(awal?.foto)

  const met = JENIS_OLAHRAGA.find((j) => j.nama === jenis)?.met
  useEffect(() => {
    if (manual || !beratTerakhir || !met) return
    const menit = Number(durasi)
    if (menit > 0) setKalori(String(Math.round((met * FAKTOR[intensitas] * beratTerakhir.kg * menit) / 60)))
  }, [manual, beratTerakhir, met, durasi, intensitas])

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
