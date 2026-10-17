import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { bacaPengaturan, db } from '../db'
import { fmt, hitungBmi, labelBmi, METRIK, type KunciMetrik } from '../lib/komposisi'
import { akhirHari, awalHari, labelPendek, tambahHari } from '../lib/tanggal'
import { DaftarPekan } from './KartuPekan'

const RENTANG = [7, 14, 30, 90] as const
const WARNA = { aksen: '#fc4c02', hijau: '#10b981', indigo: '#6366f1', grid: '#e4e4e7' }

export default function Progres() {
  const [hari, setHari] = useState<number>(14)
  const [metrik, setMetrik] = useState<KunciMetrik>('kg')
  const pengaturan = bacaPengaturan()

  const data = useLiveQuery(async () => {
    const dari = awalHari(tambahHari(Date.now(), -(hari - 1)))
    const sampai = akhirHari(Date.now())
    const [m, o, semuaBerat] = await Promise.all([
      db.makan.where('waktu').between(dari, sampai, true, true).toArray(),
      db.olahraga.where('waktu').between(dari, sampai, true, true).toArray(),
      db.berat.orderBy('waktu').toArray(),
    ])
    const baris = Array.from({ length: hari }, (_, i) => {
      const t = awalHari(tambahHari(dari, i))
      const dalam = (w: number) => w >= t && w <= akhirHari(t)
      return {
        label: labelPendek(t),
        masuk: m.filter((x) => dalam(x.waktu)).reduce((s, x) => s + (x.kalori ?? 0), 0),
        menit: o.filter((x) => dalam(x.waktu)).reduce((s, x) => s + x.durasi, 0),
      }
    })
    return { baris, semuaBerat, dari, sampai }
  }, [hari])

  const semua = data?.semuaBerat ?? []
  const dalamRentang = semua.filter((b) => b.waktu >= (data?.dari ?? 0) && b.waktu <= (data?.sampai ?? 0))
  const m = METRIK.find((x) => x.kunci === metrik)!
  const titik = dalamRentang.filter((b) => b[metrik] !== undefined).map((b) => ({ label: labelPendek(b.waktu), nilai: b[metrik] as number }))
  const adaData = (k: KunciMetrik) => semua.some((b) => b[k] !== undefined)
  const metrikAda = METRIK.filter((x) => adaData(x.kunci))

  const selisih = dalamRentang.length >= 2 ? Math.round((dalamRentang[dalamRentang.length - 1].kg - dalamRentang[0].kg) * 10) / 10 : undefined
  const hariMakan = data?.baris.filter((x) => x.masuk > 0) ?? []
  const rataMasuk = hariMakan.length ? Math.round(hariMakan.reduce((s, x) => s + x.masuk, 0) / hariMakan.length) : 0
  const totalMenit = data?.baris.reduce((s, x) => s + x.menit, 0) ?? 0
  const hariOlahraga = data?.baris.filter((x) => x.menit > 0).length ?? 0
  const rapat = hari > 14
  const terakhir = semua[semua.length - 1]
  const bmi = terakhir ? hitungBmi(terakhir.kg, pengaturan.tinggi) : undefined

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {RENTANG.map((r) => (
          <button
            key={r}
            onClick={() => setHari(r)}
            className={`flex-1 rounded-full py-2 text-sm font-bold ${hari === r ? 'bg-malam text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200'}`}
          >
            {r} hari
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Angka judul="Perubahan berat" nilai={selisih === undefined ? '–' : `${selisih > 0 ? '+' : ''}${fmt(selisih)}`} satuan="kg" baik={selisih === undefined ? undefined : selisih <= 0} />
        <Angka judul="Rata-rata kalori" nilai={rataMasuk ? String(rataMasuk) : '–'} satuan="kkal/hari" />
        <Angka judul="Hari olahraga" nilai={String(hariOlahraga)} satuan={`${totalMenit} menit`} />
      </div>

      <Kartu judul="Ringkasan mingguan (Senin–Minggu)">
        <DaftarPekan />
      </Kartu>

      <Kartu judul="Berat & komposisi tubuh">
        {semua.length === 0 ? (
          <Kosong teks="Belum ada catatan berat." />
        ) : (
          <>
            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {metrikAda.map((x) => (
                <button
                  key={x.kunci}
                  onClick={() => setMetrik(x.kunci)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${metrik === x.kunci ? 'bg-indigo-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                >
                  {x.pendek}
                </button>
              ))}
            </div>
            {titik.length === 0 ? (
              <Kosong teks="Belum ada data pada rentang ini." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={titik} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={WARNA.grid} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} allowDecimals />
                  <Tooltip formatter={(v) => [`${fmt(Number(v), m.desimal)} ${m.satuan}`, m.label]} />
                  {metrik === 'kg' && pengaturan.targetBerat && (
                    <ReferenceLine y={pengaturan.targetBerat} stroke={WARNA.hijau} strokeDasharray="4 4" label={{ value: 'Target', fontSize: 11, fill: WARNA.hijau }} />
                  )}
                  <Line type="monotone" dataKey="nilai" stroke={WARNA.indigo} strokeWidth={3} dot={{ r: 4, fill: WARNA.indigo }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            <h4 className="label-kecil mb-2 mt-4">Pemeriksaan terakhir</h4>
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {METRIK.filter((x) => adaData(x.kunci)).map((x) => {
                const ada = semua.filter((b) => b[x.kunci] !== undefined)
                const kini = ada[ada.length - 1][x.kunci] as number
                const lalu = ada.length > 1 ? (ada[ada.length - 2][x.kunci] as number) : undefined
                const d = lalu !== undefined ? Math.round((kini - lalu) * 10) / 10 : undefined
                const baik = d === undefined || d === 0 || x.turunBaik === undefined ? undefined : x.turunBaik ? d < 0 : d > 0
                return (
                  <div key={x.kunci} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-zinc-600">{x.label}</span>
                    <span className="angka text-base">
                      {fmt(kini, x.desimal)}
                      <span className="ml-1 text-xs font-semibold text-zinc-400">{x.satuan}</span>
                      {d !== undefined && d !== 0 && (
                        <span className={`ml-2 text-xs font-bold ${baik === undefined ? 'text-zinc-400' : baik ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {d > 0 ? '▲' : '▼'} {fmt(Math.abs(d), x.desimal)}
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
              {bmi && (
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-zinc-600">BMI</span>
                  <span className="angka text-base">
                    {fmt(bmi)} <span className="ml-1 text-xs font-semibold text-zinc-400">{labelBmi(bmi)}</span>
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-400">▲▼ dibandingkan pemeriksaan sebelumnya. Hijau = ke arah yang membaik.</p>
          </>
        )}
      </Kartu>

      <Kartu judul="Kalori masuk per hari (kkal)">
        {hariMakan.length === 0 ? (
          <Kosong />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.baris} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={WARNA.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={rapat ? Math.floor(hari / 6) : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} kkal`, 'Masuk']} />
              {pengaturan.targetKalori && <ReferenceLine y={pengaturan.targetKalori} stroke={WARNA.hijau} strokeDasharray="4 4" label={{ value: 'Target', fontSize: 11, fill: WARNA.hijau }} />}
              <Bar dataKey="masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Kartu>

      <Kartu judul="Durasi olahraga per hari (menit)">
        {totalMenit === 0 ? (
          <Kosong />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.baris} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={WARNA.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={rapat ? Math.floor(hari / 6) : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} menit`, 'Olahraga']} />
              <Bar dataKey="menit" fill={WARNA.aksen} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Kartu>
    </div>
  )
}

const Angka = ({ judul, nilai, satuan, baik }: { judul: string; nilai: string; satuan: string; baik?: boolean }) => (
  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70">
    <div className="label-kecil !text-[10px] leading-tight">{judul}</div>
    <div className={`angka mt-2 text-2xl ${baik === undefined ? '' : baik ? 'text-emerald-600' : 'text-amber-600'}`}>{nilai}</div>
    <div className="mt-0.5 text-[11px] text-zinc-400">{satuan}</div>
  </div>
)

const Kartu = ({ judul, children }: { judul: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
    <h3 className="judul-sport mb-3 text-sm">{judul}</h3>
    {children}
  </div>
)

const Kosong = ({ teks = 'Belum ada data pada rentang ini.' }: { teks?: string }) => <p className="py-8 text-center text-sm text-zinc-400">{teks}</p>
