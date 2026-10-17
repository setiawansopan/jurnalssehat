import Dexie, { type EntityTable } from 'dexie'

export const JENIS_MAKAN = ['Sarapan', 'Makan Siang', 'Makan Malam', 'Camilan'] as const
export type JenisMakan = (typeof JENIS_MAKAN)[number]

export const INTENSITAS = ['Ringan', 'Sedang', 'Berat'] as const
export type Intensitas = (typeof INTENSITAS)[number]

// Foto disimpan sebagai data mentah (bukan Blob) karena Blob di IndexedDB bisa hilang di Safari iOS.
export interface FotoData {
  buf: ArrayBuffer
  tipe: string
}

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
  foto?: Blob // hanya di memori; dibentuk dari fotoData saat dibaca
  fotoData?: FotoData
}

export interface Olahraga {
  id?: number
  waktu: number
  jenis: string
  durasi: number // menit
  intensitas: Intensitas
  kalori?: number
  catatan?: string
  foto?: Blob // hanya di memori; dibentuk dari fotoData saat dibaca
  fotoData?: FotoData
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

const bacaBuffer = (b: Blob) =>
  new Promise<ArrayBuffer>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as ArrayBuffer)
    r.onerror = () => rej(r.error)
    r.readAsArrayBuffer(b)
  })

// Ubah foto (Blob) menjadi data mentah sebelum ditulis ke database.
export async function kemas<T extends { foto?: Blob; fotoData?: FotoData }>(x: T): Promise<T> {
  const { foto, fotoData: _lama, ...sisa } = x
  if (!foto) return sisa as T
  return { ...sisa, fotoData: { buf: await bacaBuffer(foto), tipe: foto.type || 'image/jpeg' } } as T
}

// Saat dibaca, bentuk kembali Blob dari data mentah agar mudah ditampilkan.
const pulihkanFoto = <T extends { foto?: Blob; fotoData?: FotoData }>(o: T): T => {
  if (o.fotoData) o.foto = new Blob([o.fotoData.buf], { type: o.fotoData.tipe })
  return o
}
db.makan.hook('reading', pulihkanFoto)
db.olahraga.hook('reading', pulihkanFoto)

// Foto lama yang masih berupa Blob dipindahkan ke format baru selagi masih bisa dibaca.
export async function migrasiFoto() {
  for (const x of await db.makan.toArray()) {
    if (!x.foto || x.fotoData) continue
    try {
      await db.makan.put(await kemas(x))
    } catch {
      /* Blob sudah tidak terbaca; biarkan */
    }
  }
  for (const x of await db.olahraga.toArray()) {
    if (!x.foto || x.fotoData) continue
    try {
      await db.olahraga.put(await kemas(x))
    } catch {
      /* Blob sudah tidak terbaca; biarkan */
    }
  }
}

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
