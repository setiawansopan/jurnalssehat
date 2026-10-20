import type { Olahraga } from '../db'
import { fmt } from './komposisi'

export type KunciDetail = 'jarak' | 'langkah' | 'detakRata' | 'detakMaks' | 'elevasi' | 'kadensi' | 'lap' | 'set' | 'repetisi' | 'beban' | 'rpe'

export interface MetrikDetail {
  kunci: KunciDetail
  label: string
  pendek: string
  satuan: string
  desimal: number
  teks: (n: string) => string // untuk kalimat di laporan
}

// Urutan di sini adalah urutan tampil.
export const METRIK_DETAIL: MetrikDetail[] = [
  { kunci: 'jarak', label: 'Jarak', pendek: 'Jarak', satuan: 'km', desimal: 2, teks: (n) => `${n} km` },
  { kunci: 'langkah', label: 'Jumlah langkah', pendek: 'Langkah', satuan: 'langkah', desimal: 0, teks: (n) => `${n} langkah` },
  { kunci: 'detakRata', label: 'Detak jantung rata-rata', pendek: 'Detak rata-rata', satuan: 'bpm', desimal: 0, teks: (n) => `detak rata-rata ${n} bpm` },
  { kunci: 'detakMaks', label: 'Detak jantung maksimum', pendek: 'Detak maks', satuan: 'bpm', desimal: 0, teks: (n) => `detak maks ${n} bpm` },
  { kunci: 'elevasi', label: 'Tanjakan kumulatif', pendek: 'Tanjakan', satuan: 'm', desimal: 0, teks: (n) => `tanjakan ${n} m` },
  { kunci: 'kadensi', label: 'Kadensi (per menit)', pendek: 'Kadensi', satuan: '/mnt', desimal: 0, teks: (n) => `kadensi ${n}/mnt` },
  { kunci: 'lap', label: 'Jumlah lap', pendek: 'Lap', satuan: 'lap', desimal: 0, teks: (n) => `${n} lap` },
  { kunci: 'set', label: 'Jumlah set', pendek: 'Set', satuan: 'set', desimal: 0, teks: (n) => `${n} set` },
  { kunci: 'repetisi', label: 'Total repetisi', pendek: 'Repetisi', satuan: 'kali', desimal: 0, teks: (n) => `${n} repetisi` },
  { kunci: 'beban', label: 'Beban terberat (kg)', pendek: 'Beban maks', satuan: 'kg', desimal: 1, teks: (n) => `beban maks ${n} kg` },
  { kunci: 'rpe', label: 'Tingkat kelelahan (1–10)', pendek: 'Kelelahan', satuan: '/10', desimal: 0, teks: (n) => `kelelahan ${n}/10` },
]

const JALAN_KAKI: KunciDetail[] = ['langkah', 'jarak', 'detakRata', 'detakMaks', 'elevasi']
const RINGAN: KunciDetail[] = ['detakRata', 'detakMaks']

// Detail yang ditawarkan di form per jenis olahraga (kelelahan selalu ada).
const RELEVAN: Record<string, KunciDetail[]> = {
  'Jalan santai': JALAN_KAKI,
  'Jalan cepat': JALAN_KAKI,
  'Jogging / lari': ['jarak', 'langkah', 'detakRata', 'detakMaks', 'kadensi', 'elevasi'],
  Bersepeda: ['jarak', 'detakRata', 'detakMaks', 'elevasi', 'kadensi'],
  Renang: ['jarak', 'lap', 'detakRata', 'detakMaks'],
  'Senam / aerobik': RINGAN,
  Zumba: RINGAN,
  'Yoga / peregangan': ['detakRata'],
  'Latihan beban / gym': ['set', 'repetisi', 'beban', 'detakRata', 'detakMaks'],
  HIIT: RINGAN,
  Badminton: RINGAN,
  'Futsal / sepak bola': RINGAN,
  Basket: RINGAN,
  'Naik turun tangga': ['langkah', 'elevasi', 'detakRata', 'detakMaks'],
  Lainnya: ['jarak', 'langkah', 'detakRata', 'detakMaks'],
}

export const detailRelevan = (jenis: string): KunciDetail[] => [...(RELEVAN[jenis] ?? RELEVAN.Lainnya), 'rpe']

export interface Statistik {
  label: string
  nilai: string
  satuan?: string
}

// Pace (menit/km) untuk jalan dan lari, kecepatan (km/jam) untuk lainnya. Dihitung, tidak disimpan.
export function kecepatan(o: Olahraga): Statistik | undefined {
  if (!o.jarak || o.jarak <= 0 || o.durasi <= 0) return undefined
  if (/^(Jalan|Jogging)/.test(o.jenis)) {
    const total = o.durasi / o.jarak
    let menit = Math.floor(total)
    let detik = Math.round((total - menit) * 60)
    if (detik === 60) {
      menit += 1
      detik = 0
    }
    return { label: 'Pace', nilai: `${menit}:${String(detik).padStart(2, '0')}`, satuan: '/km' }
  }
  return { label: 'Kecepatan', nilai: fmt(o.jarak / (o.durasi / 60), 1), satuan: 'km/jam' }
}

export const detailTerisi = (o: Olahraga) => METRIK_DETAIL.filter((m) => o[m.kunci] !== undefined)

// Untuk kartu di jurnal.
export function statDetail(o: Olahraga): Statistik[] {
  const k = kecepatan(o)
  return [
    ...detailTerisi(o).map((m) => ({ label: m.pendek, nilai: fmt(o[m.kunci]!, m.desimal), satuan: m.satuan })),
    ...(k ? [k] : []),
  ]
}

// Untuk laporan dokter: kalimat pendek.
export function teksDetail(o: Olahraga): string[] {
  const k = kecepatan(o)
  return [
    ...detailTerisi(o).map((m) => m.teks(fmt(o[m.kunci]!, m.desimal))),
    ...(k ? [`${k.label.toLowerCase()} ${k.nilai} ${k.satuan}`] : []),
  ]
}
