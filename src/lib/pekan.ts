import { db } from '../db'
import { durasiMenit } from './tidur'
import { akhirHari, awalHari, tambahHari } from './tanggal'

// Pekan dihitung Senin–Minggu.
export const awalPekan = (t: number) => {
  const d = new Date(awalHari(t))
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export interface Pekan {
  mulai: number
  akhir: number
  menit: number
  hariOlahraga: number
  beratRata?: number
  beratAkhir?: number
  jumlahBerat: number
  tidurRataMenit?: number // rata-rata per hari yang tercatat
  hariTidur: number
}

export async function ringkasPekan(dari: number, sampai: number): Promise<Pekan[]> {
  const a = awalPekan(dari)
  const z = akhirHari(tambahHari(awalPekan(sampai), 6))
  const [o, t, b] = await Promise.all([
    db.olahraga.where('waktu').between(a, z, true, true).toArray(),
    db.tidur.where('waktu').between(a, z, true, true).toArray(),
    db.berat.where('waktu').between(a, z, true, true).sortBy('waktu'),
  ])
  const hasil: Pekan[] = []
  for (let m = a; m <= awalPekan(sampai); m = tambahHari(m, 7)) {
    const akhir = akhirHari(tambahHari(m, 6))
    const dalam = (w: number) => w >= m && w <= akhir
    const ow = o.filter((x) => dalam(x.waktu))
    const bw = b.filter((x) => dalam(x.waktu))
    const tw = t.filter((x) => dalam(x.waktu))
    const hariTidur = new Set(tw.map((x) => awalHari(x.waktu))).size
    hasil.push({
      mulai: m,
      akhir,
      menit: ow.reduce((s, x) => s + x.durasi, 0),
      hariOlahraga: new Set(ow.map((x) => awalHari(x.waktu))).size,
      beratRata: bw.length ? Math.round((bw.reduce((s, x) => s + x.kg, 0) / bw.length) * 10) / 10 : undefined,
      beratAkhir: bw.length ? bw[bw.length - 1].kg : undefined,
      jumlahBerat: bw.length,
      hariTidur,
      tidurRataMenit: hariTidur ? Math.round(tw.reduce((s, x) => s + durasiMenit(x), 0) / hariTidur) : undefined,
    })
  }
  return hasil
}

export const labelPekan = (p: Pekan) => {
  const f = (t: number, tahun = false) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', ...(tahun ? { year: 'numeric' } : {}) })
  return `${f(p.mulai)} – ${f(p.akhir)}`
}

export const fmtKg = (n: number) => String(n).replace('.', ',')
