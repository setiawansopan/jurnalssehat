import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { bacaPengaturan, db } from '../db'
import { rincianMakan } from '../lib/makan'
import { fmt, METRIK_TAMBAHAN } from '../lib/komposisi'
import { fmtKg, labelPekan, ringkasPekan } from '../lib/pekan'
import { akhirHari, awalHari, keInputTanggal, labelJam, labelTanggal } from '../lib/tanggal'
import { Foto, Tombol } from './ui'

export default function Laporan({ dari, sampai, onTutup }: { dari: number; sampai: number; onTutup: () => void }) {
  const d = useLiveQuery(async () => {
    const a = awalHari(dari)
    const z = akhirHari(sampai)
    const [m, o, b] = await Promise.all([
      db.makan.where('waktu').between(a, z, true, true).sortBy('waktu'),
      db.olahraga.where('waktu').between(a, z, true, true).sortBy('waktu'),
      db.berat.where('waktu').between(a, z, true, true).sortBy('waktu'),
    ])
    const hariSet = new Set([...m, ...o, ...b].map((x) => awalHari(x.waktu)))
    const pekan = await ringkasPekan(a, z)
    return { m, o, b, pekan, hari: [...hariSet].sort((x, y) => x - y) }
  }, [dari, sampai])

  if (!d) return null
  const target = bacaPengaturan().targetMenitPekan
  const kolomKomp = METRIK_TAMBAHAN.filter((k) => d.b.some((x) => x[k.kunci] !== undefined))
  const barisKomp = d.b.filter((x) => kolomKomp.some((k) => x[k.kunci] !== undefined))
  const hariMakan = new Set(d.m.filter((x) => x.kalori).map((x) => awalHari(x.waktu)))
  const totalMasuk = d.m.reduce((s, x) => s + (x.kalori ?? 0), 0)
  const rata = hariMakan.size ? Math.round(totalMasuk / hariMakan.size) : 0
  const totalMenit = d.o.reduce((s, x) => s + x.durasi, 0)

  return createPortal(
    <div className="laporan fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="no-print sticky top-0 z-10 flex gap-2 border-b border-zinc-200 bg-white p-3">
        <Tombol warna="abu" onClick={onTutup}>
          ← Kembali
        </Tombol>
        <Tombol className="flex-1" onClick={() => window.print()}>
          Cetak / Simpan sebagai PDF
        </Tombol>
      </div>

      <div className="mx-auto max-w-3xl p-5">
        <h1 className="text-2xl font-bold">Laporan Jurnal Sehat</h1>
        <p className="text-zinc-600">
          {labelTanggal(dari)} – {labelTanggal(sampai)}
        </p>

        <table className="mt-4 w-full border-collapse text-sm">
          <tbody>
            <tr>
              <Sel k="Berat awal → akhir" v={d.b.length ? `${d.b[0].kg} → ${d.b[d.b.length - 1].kg} kg` : '–'} />
              <Sel k="Rata-rata kalori masuk" v={rata ? `${rata} kkal/hari` : '–'} />
            </tr>
            <tr>
              <Sel k="Total olahraga" v={`${totalMenit} menit (${new Set(d.o.map((x) => awalHari(x.waktu))).size} hari)`} />
              <Sel k="Hari tercatat" v={`${d.hari.length} hari`} />
            </tr>
          </tbody>
        </table>

        {barisKomp.length > 0 && (
          <>
            <h2 className="mt-5 text-base font-bold">Komposisi tubuh</h2>
            <table className="mt-1 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-100 text-left">
                  <th className="border border-zinc-300 p-1.5">Tanggal</th>
                  <th className="border border-zinc-300 p-1.5">Berat (kg)</th>
                  {kolomKomp.map((k) => (
                    <th key={k.kunci} className="border border-zinc-300 p-1.5">
                      {k.pendek} ({k.satuan})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {barisKomp.map((x) => (
                  <tr key={x.id}>
                    <td className="border border-zinc-300 p-1.5">{keInputTanggal(x.waktu)}</td>
                    <td className="border border-zinc-300 p-1.5">{fmt(x.kg)}</td>
                    {kolomKomp.map((k) => (
                      <td key={k.kunci} className="border border-zinc-300 p-1.5">
                        {x[k.kunci] !== undefined ? fmt(x[k.kunci]!, k.desimal) : '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {d.pekan.length > 0 && (
          <>
            <h2 className="mt-5 text-base font-bold">Ringkasan mingguan</h2>
            <table className="mt-1 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-100 text-left">
                  <th className="border border-zinc-300 p-1.5">Pekan</th>
                  <th className="border border-zinc-300 p-1.5">Berat (rata-rata)</th>
                  <th className="border border-zinc-300 p-1.5">Olahraga (target {target} mnt)</th>
                </tr>
              </thead>
              <tbody>
                {d.pekan.map((p) => (
                  <tr key={p.mulai}>
                    <td className="border border-zinc-300 p-1.5">{labelPekan(p)}</td>
                    <td className="border border-zinc-300 p-1.5">{p.beratRata !== undefined ? `${fmtKg(p.beratRata)} kg` : '–'}</td>
                    <td className="border border-zinc-300 p-1.5">
                      {p.menit} menit ({p.hariOlahraga} hari) {p.menit >= target ? '✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {d.hari.length === 0 &&<p className="mt-8 text-center text-zinc-500">Tidak ada catatan pada rentang ini.</p>}

        {d.hari.map((h) => {
          const m = d.m.filter((x) => awalHari(x.waktu) === h)
          const o = d.o.filter((x) => awalHari(x.waktu) === h)
          const b = d.b.filter((x) => awalHari(x.waktu) === h)
          const kal = m.reduce((s, x) => s + (x.kalori ?? 0), 0)
          return (
            <section key={h} className="laporan-hari mt-6">
              <h2 className="border-b-2 border-aksen-600 pb-1 text-base font-bold">
                {labelTanggal(h)}
                <span className="ml-2 text-sm font-normal text-zinc-600">{kal ? `· ${kal} kkal` : ''}</span>
              </h2>
              <div className="mt-2 space-y-2">
                {b.map((x) => (
                  <Baris key={`b${x.id}`} jam={labelJam(x.waktu)} judul={`Berat badan: ${fmt(x.kg)} kg`} catatan={[METRIK_TAMBAHAN.filter((k) => x[k.kunci] !== undefined).map((k) => `${k.pendek} ${fmt(x[k.kunci]!, k.desimal)} ${k.satuan}`).join(' · '), x.catatan].filter(Boolean).join(' — ')} />
                ))}
                {m.map((x) => (
                  <Baris
                    key={`m${x.id}`}
                    jam={labelJam(x.waktu)}
                    judul={`${x.jenis}: ${rincianMakan(x)}${x.kalori && (x.items?.length ?? 1) > 1 ? ` — total ${x.kalori} kkal` : ''}`}
                    catatan={[x.rasa, x.catatan].filter(Boolean).join(' · ')}
                    foto={x.foto}
                  />
                ))}
                {o.map((x) => (
                  <Baris
                    key={`o${x.id}`}
                    jam={labelJam(x.waktu)}
                    judul={`Olahraga: ${x.jenis}, ${x.durasi} menit, ${x.intensitas}${x.kalori ? ` — ±${x.kalori} kkal` : ''}`}
                    catatan={x.catatan}
                    foto={x.foto}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}

const Sel = ({ k, v }: { k: string; v: string }) => (
  <td className="border border-zinc-300 p-2">
    <div className="text-xs text-zinc-500">{k}</div>
    <div className="font-semibold">{v}</div>
  </td>
)

function Baris({ jam, judul, catatan, foto }: { jam: string; judul: string; catatan?: string; foto?: Blob }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-12 shrink-0 text-zinc-500">{jam}</span>
      <div className="min-w-0 flex-1">
        <div>{judul}</div>
        {catatan && <div className="text-xs text-zinc-500">{catatan}</div>}
      </div>
      {foto && <Foto blob={foto} className="h-24 w-24 shrink-0 rounded-lg" />}
    </div>
  )
}
