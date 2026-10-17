interface Gambar {
  sumber: CanvasImageSource
  lebar: number
  tinggi: number
  tutup: () => void
}

// Browser HP berbeda-beda dalam mendukung pembacaan gambar, jadi dicoba bertingkat:
// 1) createImageBitmap dengan orientasi EXIF, 2) createImageBitmap polos, 3) elemen <img>.
async function muatGambar(file: Blob): Promise<Gambar> {
  if (typeof createImageBitmap === 'function') {
    for (const opsi of [{ imageOrientation: 'from-image' as const }, undefined]) {
      try {
        const b = opsi ? await createImageBitmap(file, opsi) : await createImageBitmap(file)
        if (b.width > 0 && b.height > 0) return { sumber: b, lebar: b.width, tinggi: b.height, tutup: () => b.close?.() }
      } catch {
        /* coba cara berikutnya */
      }
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('gambar tidak bisa dibaca'))
      i.src = url
    })
    return { sumber: img, lebar: img.naturalWidth, tinggi: img.naturalHeight, tutup: () => URL.revokeObjectURL(url) }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

const BATAS_ASLI = 8 * 1024 * 1024 // foto asli yang masih boleh disimpan apa adanya

// Kecilkan foto agar penyimpanan HP tidak cepat penuh.
// Kalau pengecilan gagal tapi fotonya wajar ukurannya, foto asli disimpan supaya pengguna tidak terhalang.
export async function kompresFoto(file: File, maks = 1280, kualitas = 0.8): Promise<Blob> {
  try {
    const g = await muatGambar(file)
    try {
      const skala = Math.min(1, maks / Math.max(g.lebar, g.tinggi))
      const w = Math.max(1, Math.round(g.lebar * skala))
      const h = Math.max(1, Math.round(g.tinggi * skala))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas tidak tersedia')
      ctx.drawImage(g.sumber, 0, 0, w, h)
      const hasil = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', kualitas))
      if (!hasil || hasil.size === 0) throw new Error('gagal menyimpan hasil')
      return hasil
    } finally {
      g.tutup()
    }
  } catch (e) {
    console.error('Pengecilan foto gagal', e)
    if (file.type.startsWith('image/') && file.size <= BATAS_ASLI) return file
    throw e
  }
}

export const blobKeDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

export const dataUrlKeBlob = async (u: string) => (await fetch(u)).blob()
