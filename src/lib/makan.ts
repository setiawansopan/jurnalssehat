import type { ItemMakan, Makan } from '../db'

// Daftar item satu waktu makan. Catatan lama (tanpa items) dianggap satu item.
export const daftarItem = (m: Makan): ItemMakan[] =>
  m.items?.length ? m.items : [{ nama: m.nama, porsi: m.porsi, kalori: m.kalori }]

// Teks ringkas untuk laporan/CSV, mis. "Nasi putih (1 centong) 130 kkal; Sambal (1 sdm) 20 kkal"
export const rincianMakan = (m: Makan) =>
  daftarItem(m)
    .map((i) => `${i.nama}${i.porsi ? ` (${i.porsi})` : ''}${i.kalori ? ` ${i.kalori} kkal` : ''}`)
    .join('; ')
