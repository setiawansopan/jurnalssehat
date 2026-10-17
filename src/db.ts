import Dexie, { type EntityTable } from 'dexie'

export const JENIS_MAKAN = ['Sarapan', 'Makan Siang', 'Makan Malam', 'Camilan'] as const
export type JenisMakan = (typeof JENIS_MAKAN)[number]

export const INTENSITAS = ['Ringan', 'Sedang', 'Berat'] as const
export type Intensitas = (typeof INTENSITAS)[number]

export interface ItemMakan {
  nama: string
  porsi: string
  kalori?: number
}

export interface Makan {
  id?: number
  waktu: number // epoch ms
  jenis: JenisMakan
  nama: string
  porsi: string
  kalori?: number
  items?: ItemMakan[] // rincian satu waktu makan; nama/porsi/kalori di atas adalah ringkasannya
  rasa?: string // lapar / kenyang / dll
  catatan?: string
  foto?: Blob
}

export interface Olahraga {
  id?: number
  waktu: number
  jenis: string
  durasi: number // menit
  intensitas: Intensitas
  kalori?: number
  catatan?: string
  foto?: Blob
}

export interface Berat {
  id?: number
  waktu: number
  kg: number
  // Komposisi tubuh (opsional, biasanya dari alat ukur di klinik)
  lemak?: number // lemak tubuh, %
  otot?: number // massa otot, kg
  tulang?: number // massa tulang, kg
  air?: number // kadar air tubuh, %
  viseral?: number // level lemak viseral
  bmr?: number // kkal/hari
  usiaMetabolik?: number // tahun
  pinggang?: number // lingkar pinggang, cm
  catatan?: string
}

export const db = new Dexie('jurnal-sehat') as Dexie & {
  makan: EntityTable<Makan, 'id'>
  olahraga: EntityTable<Olahraga, 'id'>
  berat: EntityTable<Berat, 'id'>
}

db.version(1).stores({
  makan: '++id, waktu',
  olahraga: '++id, waktu',
  berat: '++id, waktu',
})

export interface Pengaturan {
  targetKalori?: number
  targetBerat?: number
  targetMenitPekan: number
  tinggi?: number // cm, untuk menghitung BMI
}

export const TARGET_MENIT_PEKAN_BAWAAN = 150 // anjuran dokter; bisa diubah di Lainnya

const KEY = 'jurnal-sehat:pengaturan'
export function bacaPengaturan(): Pengaturan {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...p, targetMenitPekan: p.targetMenitPekan > 0 ? p.targetMenitPekan : TARGET_MENIT_PEKAN_BAWAAN }
  } catch {
    return { targetMenitPekan: TARGET_MENIT_PEKAN_BAWAAN }
  }
}
export function simpanPengaturan(p: Pengaturan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* abaikan */
  }
}
