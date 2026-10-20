import { useState } from 'react'
import { db, type Tidur } from '../db'
import { keInputTanggal } from '../lib/tanggal'
import { fmtDurasiPanjang, KUALITAS_TIDUR } from '../lib/tidur'
import { Field, inputCls, Sheet, Tombol } from './ui'

const dua = (n: number) => String(n).padStart(2, '0')
const jamMenit = (t: number) => `${dua(new Date(t).getHours())}:${dua(new Date(t).getMinutes())}`

// Bangun pada tanggal yang dipilih; mulai tidur adalah jam itu pada hari yang sama,
// atau hari sebelumnya bila jamnya lebih akhir (mis. tidur 23:00, bangun 06:00).
function hitung(tanggal: string, mulaiJam: string, bangunJam: string) {
  const bangun = new Date(`${tanggal}T${bangunJam}`)
  const mulai = new Date(`${tanggal}T${mulaiJam}`)
  if (mulai.getTime() >= bangun.getTime()) mulai.setDate(mulai.getDate() - 1)
  return { mulai: mulai.getTime(), bangun: bangun.getTime() }
}

export default function FormTidur({ awal, waktuAwal, onTutup }: { awal?: Tidur; waktuAwal: number; onTutup: () => void }) {
  const [tanggal, setTanggal] = useState(keInputTanggal(awal?.selesai ?? waktuAwal))
  const [mulaiJam, setMulaiJam] = useState(awal ? jamMenit(awal.mulai) : '23:00')
  const [bangunJam, setBangunJam] = useState(awal ? jamMenit(awal.selesai) : new Date().getHours() < 12 ? jamMenit(Date.now()) : '06:00')
  const [kualitas, setKualitas] = useState<number | undefined>(awal?.kualitas)
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')

  const { mulai, bangun } = hitung(tanggal, mulaiJam, bangunJam)
  const menit = Math.round((bangun - mulai) / 60_000)
  const valid = Number.isFinite(menit) && menit > 0

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    const data: Tidur = { mulai, selesai: bangun, waktu: bangun, kualitas, catatan: catatan.trim() || undefined }
    if (awal?.id) await db.tidur.put({ ...data, id: awal.id })
    else await db.tidur.add(data)
    onTutup()
  }

  async function hapus() {
    if (awal?.id && confirm('Hapus catatan tidur ini?')) {
      await db.tidur.delete(awal.id)
      onTutup()
    }
  }

  return (
    <Sheet judul={awal ? 'Ubah catatan tidur' : 'Catat tidur'} onTutup={onTutup}>
      <form onSubmit={simpan} className="space-y-4">
        <Field label="Tanggal bangun">
          <input type="date" required className={inputCls} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mulai tidur">
            <input type="time" required className={inputCls} value={mulaiJam} onChange={(e) => setMulaiJam(e.target.value)} />
          </Field>
          <Field label="Bangun">
            <input type="time" required className={inputCls} value={bangunJam} onChange={(e) => setBangunJam(e.target.value)} />
          </Field>
        </div>

        <div className="flex items-baseline justify-between rounded-xl bg-malam px-4 py-3 text-white">
          <span className="label-kecil !text-white/60">Durasi tidur</span>
          <span className="angka text-2xl">{valid ? fmtDurasiPanjang(menit) : '–'}</span>
        </div>
        {valid && menit > 14 * 60 && <p className="text-sm font-medium text-amber-600">Lebih dari 14 jam. Pastikan jam mulai dan bangun sudah benar.</p>}
        <p className="-mt-2 text-xs text-zinc-500">Tidur siang juga boleh dicatat sebagai catatan terpisah. Semuanya dijumlahkan per hari.</p>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Kualitas tidur</span>
          <div className="grid grid-cols-5 gap-2">
            {KUALITAS_TIDUR.map((label, i) => {
              const n = i + 1
              const aktif = kualitas === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setKualitas(aktif ? undefined : n)}
                  aria-label={label}
                  className={`rounded-xl border py-2.5 text-lg font-extrabold ${aktif ? 'border-sky-500 bg-sky-500 text-white' : 'border-zinc-300 bg-white text-zinc-600'}`}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{kualitas ? `${kualitas} · ${KUALITAS_TIDUR[kualitas - 1]}` : '1 = buruk, 5 = sangat baik (opsional)'}</p>
        </div>

        <Field label="Catatan">
          <textarea rows={2} className={inputCls} placeholder="mis. sering terbangun, minum kopi sore" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>

        <div className="flex gap-2 pb-2">
          {awal && (
            <Tombol type="button" warna="merah" onClick={hapus}>
              Hapus
            </Tombol>
          )}
          <Tombol type="submit" className="flex-1" disabled={!valid}>
            Simpan
          </Tombol>
        </div>
      </form>
    </Sheet>
  )
}
