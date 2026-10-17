# Jurnal Sehat

PWA untuk mencatat makan, olahraga (dengan foto), dan berat badan harian. Data disimpan lokal di perangkat (IndexedDB).

## Menjalankan

```bash
npm install
npm run dev      # pengembangan, http://localhost:5173
npm run build    # hasil build di folder dist/
npm run preview  # uji hasil build
```

## Hosting di Vercel

Konfigurasi sudah ada di `vercel.json` (build Vite, cache service worker, header keamanan).

**Lewat GitHub (pembaruan otomatis):** buat repo *private* di GitHub, hubungkan dengan
`git remote add origin <url-repo>` lalu `git push -u origin main`. Di vercel.com pilih
*Add New → Project*, impor repo itu, dan klik Deploy. Setiap `git push` berikutnya otomatis tayang.

**Tanpa GitHub:** jalankan `npx vercel` di folder proyek (login sekali), lalu `npx vercel --prod`.

## Memasang di HP

Buka alamat Vercel di HP:

- Android (Chrome): menu ⋮ → Instal aplikasi
- iPhone (Safari): Bagikan → Tambah ke Layar Utama

## Catatan

- Data tiap perangkat terpisah (tidak sinkron). Gunakan Lainnya → Unduh cadangan / Pulihkan untuk memindahkan data.
- Daftar makanan di `src/lib/daftar.ts` adalah perkiraan kasar; bebas diubah.
- Ikon: edit `public/icon.svg` lalu `npm run icons`.
