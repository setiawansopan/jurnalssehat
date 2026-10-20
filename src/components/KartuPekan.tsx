import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { bacaPengaturan, db } from '../db'
import { fmt } from '../lib/komposisi'
import { fmtJamMenit } from '../lib/tidur'
import { awalPekan, labelPekan, ringkasPekan } from '../lib/pekan'
import { tambahHari } from '../lib/tanggal'
import { Ikon } from './Ikon'

export function BatangTarget({ menit, target }: { menit: number; target: number }) {
  const persen = Math.min(100, Math.round((menit / target) * 100))
  const tercapai = menit >= target
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full rounded-full ${tercapai ? 'bg-emerald-500' : 'bg-aksen-500'}`} style={{ width: `${persen}%` }} />
    </div>
  )
}

function Cincin({ menit, target }: { menit: number; target: number }) {
  const r = 44
  const keliling = 2 * Math.PI * r
  const persen = Math.min(1, menit / target)
  const tercapai = menit >= target
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-zinc-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={keliling}
          strokeDashoffset={keliling * (1 - persen)}
          className={`transition-[stroke-dashoffset] duration-700 ${tercapai ? 'stroke-emerald-500' : 'stroke-aksen-500'}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="angka text-2xl">{menit}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">/ {target} mnt</span>
      </div>
    </div>
  )
}

// Ringkasan pekan berjalan untuk halaman Jurnal.
export default function KartuPekan({ onCatatBerat }: { onCatatBerat: () => void }) {
  const pengaturan = bacaPengaturan()
  const target = pengaturan.targetMenitPekan
  const p = useLiveQuery(async () => (await ringkasPekan(Date.now(), Date.now()))[0])
  if (!p) return null
  const sisa = Math.max(0, target - p.menit)
  const tercapai = sisa === 0

  return (
    <div className="mt-3 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200/70">
      <div className="flex items-center gap-4 p-4">
        <Cincin menit={p.menit} target={target} />
        <div className="min-w-0 flex-1">
          <div className="label-kecil">Target pekan ini</div>
          <div className="text-xs text-zinc-400">{labelPekan(p)}</div>
          <div className="mt-2 text-lg font-extrabold leading-tight">
            {tercapai ? (
              <span className="text-emerald-600">Target tercapai!</span>
            ) : (
              <>
                Kurang <span className="text-aksen-600">{sisa} menit</span>
              </>
            )}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {p.hariOlahraga} hari aktif · {Math.round((p.menit / target) * 100)}%
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5 text-sm">
        {p.tidurRataMenit !== undefined ? (
          <span className="text-zinc-600">
            Tidur rata-rata <b className="angka ml-1 text-base">{fmtJamMenit(p.tidurRataMenit)} jam</b>
            <span className={`ml-2 text-xs font-bold ${p.tidurRataMenit >= pengaturan.targetTidurJam * 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {p.tidurRataMenit >= pengaturan.targetTidurJam * 60 ? '✓ capai target' : `target ${pengaturan.targetTidurJam} jam`}
            </span>
          </span>
        ) : (
          <span className="text-zinc-600">Belum ada catatan tidur pekan ini</span>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm">
        {p.beratAkhir ? (
          <span className="text-zinc-600">
            Berat pekan ini <b className="angka ml-1 text-base">{fmt(p.beratAkhir)} kg</b>
          </span>
        ) : (
          <span className="text-zinc-600">Belum timbang pekan ini</span>
        )}
        <button onClick={onCatatBerat} className="flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white active:bg-indigo-600">
          <Ikon nama="tambah" className="h-3.5 w-3.5" /> Catat berat
        </button>
      </div>
    </div>
  )
}

// Daftar ringkasan mingguan untuk halaman Progres.
export function DaftarPekan({ perHalaman = 4 }: { perHalaman?: number }) {
  const pengaturan = bacaPengaturan()
  const target = pengaturan.targetMenitPekan
  const [halaman, setHalaman] = useState(0) // 0 = paling baru
  const info = useLiveQuery(async () => {
    const pekanIni = awalPekan(Date.now())
    // Pekan terbaru di halaman ini; satu pekan sebelum yang tertua ikut diambil hanya untuk menghitung selisih.
    const terbaru = tambahHari(pekanIni, -halaman * perHalaman * 7)
    const tertua = tambahHari(terbaru, -(perHalaman - 1) * 7)
    const [a, b, c] = await Promise.all([
      db.makan.orderBy('waktu').first(),
      db.olahraga.orderBy('waktu').first(),
      db.berat.orderBy('waktu').first(),
    ])
    const awalData = Math.min(...[a, b, c].filter(Boolean).map((x) => x!.waktu), Date.now())
    const jumlahPekan = Math.round((pekanIni - awalPekan(awalData)) / (7 * 86_400_000)) + 1
    const daftar = await ringkasPekan(tambahHari(tertua, -7), terbaru)
    return { daftar, jumlahHalaman: Math.max(1, Math.ceil(jumlahPekan / perHalaman)) }
  }, [halaman, perHalaman])
  if (!info) return null
  const { jumlahHalaman, daftar } = info

  // Perubahan dibandingkan pekan sebelumnya yang punya data berat.
  let sebelumnya: number | undefined
  const baris = daftar.map((p) => {
    const selisih = p.beratRata !== undefined && sebelumnya !== undefined ? Math.round((p.beratRata - sebelumnya) * 10) / 10 : undefined
    if (p.beratRata !== undefined) sebelumnya = p.beratRata
    return { p, selisih }
  })
  const tampil = baris.slice(1).reverse() // pekan tambahan di awal hanya pembanding selisih

  return (
    <div className="space-y-3">
      {tampil.map(({ p, selisih }, i) => (
          <div key={p.mulai} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-extrabold">{labelPekan(p)}</span>
              {halaman === 0 && i === 0 && <span className="rounded-full bg-aksen-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">pekan ini</span>}
            </div>
            <div className="mt-2 flex items-baseline justify-between text-sm">
              <span className="text-zinc-500">Berat {p.jumlahBerat > 1 ? '(rata-rata)' : ''}</span>
              <span className="angka text-base">
                {p.beratRata !== undefined ? `${fmt(p.beratRata)} kg` : '–'}
                {selisih !== undefined && (
                  <span className={`ml-2 text-xs font-bold ${selisih < 0 ? 'text-emerald-600' : selisih > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
                    {selisih > 0 ? '+' : ''}
                    {fmt(selisih)}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-sm">
              <span className="text-zinc-500">Tidur (rata-rata/hari)</span>
              <span className="angka text-base">
                {p.tidurRataMenit !== undefined ? (
                  <>
                    {fmtJamMenit(p.tidurRataMenit)}
                    <span className="ml-1 text-xs font-semibold text-zinc-400">jam</span>
                    {p.tidurRataMenit >= pengaturan.targetTidurJam * 60 && <span className="ml-2 text-xs font-bold text-emerald-600">✓</span>}
                  </>
                ) : (
                  '–'
                )}
              </span>
            </div>
            <div className="mt-2">
              <BatangTarget menit={p.menit} target={target} />
              <div className="mt-1 flex justify-between text-xs text-zinc-500">
                <span>
                  Olahraga {p.menit}/{target} menit
                </span>
                <span>{p.menit >= target ? '✓ tercapai' : `${p.hariOlahraga} hari`}</span>
              </div>
            </div>
          </div>
        ))}

      {jumlahHalaman > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setHalaman(halaman + 1)}
            disabled={halaman >= jumlahHalaman - 1}
            className="flex items-center gap-1 rounded-full bg-zinc-100 px-3.5 py-2 text-sm font-bold text-zinc-700 active:bg-zinc-200 disabled:opacity-30"
          >
            <Ikon nama="kiri" className="h-4 w-4" /> Lebih lama
          </button>
          <span className="text-xs font-semibold text-zinc-400">
            {halaman + 1} / {jumlahHalaman}
          </span>
          <button
            onClick={() => setHalaman(halaman - 1)}
            disabled={halaman === 0}
            className="flex items-center gap-1 rounded-full bg-zinc-100 px-3.5 py-2 text-sm font-bold text-zinc-700 active:bg-zinc-200 disabled:opacity-30"
          >
            Lebih baru <Ikon nama="kanan" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
