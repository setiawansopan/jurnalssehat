import type { Tidur } from '../db'
import { awalHari } from './tanggal'

export const KUALITAS_TIDUR = ['Buruk', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'] as const

export const durasiMenit = (t: Tidur) => Math.max(0, Math.round((t.selesai - t.mulai) / 60_000))

// "7:30" untuk angka besar, "7 jam 30 menit" untuk kalimat.
export const fmtJamMenit = (menit: number) => {
  const j = Math.floor(menit / 60)
  const m = menit % 60
  return `${j}:${String(m).padStart(2, '0')}`
}

export const fmtDurasiPanjang = (menit: number) => {
  const j = Math.floor(menit / 60)
  const m = menit % 60
  if (j === 0) return `${m} menit`
  return m === 0 ? `${j} jam` : `${j} jam ${m} menit`
}

// Tidur dihitung pada hari bangun (mis. tidur 23:00, bangun 06:00 → masuk hari bangun).
export const menitPerHari = (daftar: Tidur[]) => {
  const peta = new Map<number, number>()
  for (const t of daftar) peta.set(awalHari(t.waktu), (peta.get(awalHari(t.waktu)) ?? 0) + durasiMenit(t))
  return peta
}
