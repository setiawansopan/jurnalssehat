import type { Berat } from '../db'

export type KunciMetrik = 'kg' | 'lemak' | 'otot' | 'tulang' | 'air' | 'viseral' | 'bmr' | 'usiaMetabolik' | 'pinggang'

export interface Metrik {
  kunci: KunciMetrik
  label: string
  pendek: string
  satuan: string
  desimal: number
  // true: turun = membaik, false: naik = membaik, undefined: netral
  turunBaik?: boolean
}

export const METRIK: Metrik[] = [
  { kunci: 'kg', label: 'Berat badan', pendek: 'Berat', satuan: 'kg', desimal: 1, turunBaik: true },
  { kunci: 'lemak', label: 'Lemak tubuh', pendek: 'Lemak', satuan: '%', desimal: 1, turunBaik: true },
  { kunci: 'otot', label: 'Massa otot', pendek: 'Otot', satuan: 'kg', desimal: 1, turunBaik: false },
  { kunci: 'tulang', label: 'Massa tulang', pendek: 'Tulang', satuan: 'kg', desimal: 1 },
  { kunci: 'air', label: 'Kadar air tubuh', pendek: 'Air', satuan: '%', desimal: 1, turunBaik: false },
  { kunci: 'viseral', label: 'Lemak viseral', pendek: 'Viseral', satuan: 'level', desimal: 0, turunBaik: true },
  { kunci: 'bmr', label: 'BMR', pendek: 'BMR', satuan: 'kkal', desimal: 0 },
  { kunci: 'usiaMetabolik', label: 'Usia metabolik', pendek: 'Usia metab.', satuan: 'tahun', desimal: 0, turunBaik: true },
  { kunci: 'pinggang', label: 'Lingkar pinggang', pendek: 'Pinggang', satuan: 'cm', desimal: 1, turunBaik: true },
]

export const METRIK_TAMBAHAN = METRIK.filter((m) => m.kunci !== 'kg')

export const fmt = (n: number, desimal = 1) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: desimal })

export const nilaiMetrik = (b: Berat, k: KunciMetrik): number | undefined => b[k]

export const adaKomposisi = (b: Berat) => METRIK_TAMBAHAN.some((m) => b[m.kunci] !== undefined)

export const hitungBmi = (kg: number, tinggiCm?: number) =>
  tinggiCm && tinggiCm > 0 ? Math.round((kg / (tinggiCm / 100) ** 2) * 10) / 10 : undefined

export function labelBmi(bmi: number) {
  // Kategori Asia-Pasifik (Kemenkes RI)
  if (bmi < 18.5) return 'Kurus'
  if (bmi < 23) return 'Normal'
  if (bmi < 25) return 'Kelebihan berat'
  if (bmi < 30) return 'Obesitas I'
  return 'Obesitas II'
}
