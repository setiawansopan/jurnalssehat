export interface MakananUmum {
  nama: string
  porsi: string
  kalori: number
}

// Perkiraan kasar per porsi — nilai sebenarnya bergantung pada resep dan ukuran porsi.
export const MAKANAN_UMUM: MakananUmum[] = [
  // Makanan pokok
  { nama: 'Nasi putih', porsi: '1 centong (100 g)', kalori: 130 },
  { nama: 'Nasi merah', porsi: '1 centong (100 g)', kalori: 110 },
  { nama: 'Nasi goreng', porsi: '1 piring', kalori: 330 },
  { nama: 'Nasi uduk', porsi: '1 piring', kalori: 350 },
  { nama: 'Lontong', porsi: '1 potong', kalori: 80 },
  { nama: 'Bubur ayam', porsi: '1 mangkuk', kalori: 300 },
  { nama: 'Mi goreng', porsi: '1 piring', kalori: 400 },
  { nama: 'Mi ayam', porsi: '1 mangkuk', kalori: 450 },
  { nama: 'Bihun goreng', porsi: '1 piring', kalori: 300 },
  { nama: 'Oatmeal', porsi: '1 mangkuk', kalori: 150 },
  { nama: 'Roti tawar', porsi: '1 lembar', kalori: 70 },
  { nama: 'Kentang rebus', porsi: '1 buah sedang', kalori: 110 },
  { nama: 'Ubi rebus', porsi: '1 buah sedang', kalori: 130 },
  // Lauk
  { nama: 'Ayam goreng', porsi: '1 potong', kalori: 250 },
  { nama: 'Ayam bakar', porsi: '1 potong', kalori: 200 },
  { nama: 'Dada ayam rebus/panggang', porsi: '100 g', kalori: 165 },
  { nama: 'Telur rebus', porsi: '1 butir', kalori: 75 },
  { nama: 'Telur dadar', porsi: '1 butir', kalori: 110 },
  { nama: 'Telur mata sapi', porsi: '1 butir', kalori: 100 },
  { nama: 'Ikan goreng', porsi: '1 potong', kalori: 150 },
  { nama: 'Ikan bakar / pepes', porsi: '1 potong', kalori: 120 },
  { nama: 'Lele goreng', porsi: '1 ekor kecil', kalori: 200 },
  { nama: 'Tempe goreng', porsi: '1 potong', kalori: 75 },
  { nama: 'Tahu goreng', porsi: '1 potong', kalori: 75 },
  { nama: 'Rendang', porsi: '1 potong', kalori: 195 },
  { nama: 'Sate ayam + bumbu kacang', porsi: '10 tusuk', kalori: 330 },
  { nama: 'Perkedel kentang', porsi: '1 buah', kalori: 80 },
  // Sayur & hidangan berkuah
  { nama: 'Sayur bayam bening', porsi: '1 mangkuk', kalori: 50 },
  { nama: 'Sayur asem', porsi: '1 mangkuk', kalori: 70 },
  { nama: 'Sayur lodeh', porsi: '1 mangkuk', kalori: 150 },
  { nama: 'Capcay', porsi: '1 porsi', kalori: 150 },
  { nama: 'Tumis kangkung', porsi: '1 porsi', kalori: 90 },
  { nama: 'Lalapan + sambal', porsi: '1 porsi', kalori: 40 },
  { nama: 'Gado-gado', porsi: '1 porsi', kalori: 300 },
  { nama: 'Pecel', porsi: '1 porsi', kalori: 250 },
  { nama: 'Soto ayam (tanpa nasi)', porsi: '1 mangkuk', kalori: 200 },
  { nama: 'Bakso', porsi: '1 mangkuk', kalori: 350 },
  { nama: 'Lontong sayur', porsi: '1 porsi', kalori: 350 },
  // Buah
  { nama: 'Pisang', porsi: '1 buah', kalori: 90 },
  { nama: 'Apel', porsi: '1 buah sedang', kalori: 80 },
  { nama: 'Jeruk', porsi: '1 buah', kalori: 60 },
  { nama: 'Pepaya', porsi: '1 potong (100 g)', kalori: 45 },
  { nama: 'Semangka', porsi: '1 potong (150 g)', kalori: 45 },
  { nama: 'Mangga', porsi: '1 potong (100 g)', kalori: 60 },
  { nama: 'Alpukat', porsi: '1/2 buah', kalori: 160 },
  // Camilan
  { nama: 'Gorengan (bakwan/pisang goreng)', porsi: '1 buah', kalori: 130 },
  { nama: 'Martabak manis', porsi: '1 potong', kalori: 250 },
  { nama: 'Biskuit', porsi: '2 keping', kalori: 100 },
  { nama: 'Kacang tanah/almond', porsi: '1 genggam (30 g)', kalori: 170 },
  { nama: 'Yoghurt plain', porsi: '1 cup', kalori: 90 },
  // Minuman
  { nama: 'Teh manis', porsi: '1 gelas', kalori: 90 },
  { nama: 'Es teh manis', porsi: '1 gelas', kalori: 100 },
  { nama: 'Kopi hitam tanpa gula', porsi: '1 cangkir', kalori: 5 },
  { nama: 'Kopi susu gula aren', porsi: '1 gelas (250 ml)', kalori: 220 },
  { nama: 'Susu', porsi: '1 gelas (200 ml)', kalori: 130 },
  { nama: 'Minuman kemasan manis', porsi: '1 botol (350 ml)', kalori: 150 },
]

export interface JenisOlahraga {
  nama: string
  met: number
}

// Nilai MET untuk perkiraan kalori terbakar: MET × berat (kg) × jam
export const JENIS_OLAHRAGA: JenisOlahraga[] = [
  { nama: 'Jalan santai', met: 3.3 },
  { nama: 'Jalan cepat', met: 4.3 },
  { nama: 'Jogging / lari', met: 7 },
  { nama: 'Bersepeda', met: 6.8 },
  { nama: 'Renang', met: 6 },
  { nama: 'Senam / aerobik', met: 6.5 },
  { nama: 'Zumba', met: 6 },
  { nama: 'Yoga / peregangan', met: 2.5 },
  { nama: 'Latihan beban / gym', met: 5 },
  { nama: 'HIIT', met: 8 },
  { nama: 'Badminton', met: 5.5 },
  { nama: 'Futsal / sepak bola', met: 7 },
  { nama: 'Basket', met: 6.5 },
  { nama: 'Naik turun tangga', met: 4 },
  { nama: 'Lainnya', met: 4 },
]
