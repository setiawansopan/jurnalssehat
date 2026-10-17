// Kecilkan foto agar penyimpanan HP tidak cepat penuh.
export async function kompresFoto(file: File, maks = 1280, kualitas = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const skala = Math.min(1, maks / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * skala)
  const h = Math.round(bmp.height * skala)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('Gagal memproses foto'))), 'image/jpeg', kualitas),
  )
}

export const blobKeDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

export const dataUrlKeBlob = async (u: string) => (await fetch(u)).blob()
