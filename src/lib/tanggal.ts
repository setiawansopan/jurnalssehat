export const awalHari = (t: number | Date) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
export const akhirHari = (t: number | Date) => awalHari(t) + 86_400_000 - 1

export const tambahHari = (t: number, n: number) => {
  const d = new Date(t)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

export const labelTanggal = (t: number) =>
  new Date(t).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const labelPendek = (t: number) =>
  new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

export const labelJam = (t: number) =>
  new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')

// nilai untuk <input type="datetime-local"> / date
const dua = (n: number) => String(n).padStart(2, '0')
export const keInputTanggal = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`
}
export const keInputWaktu = (t: number) => {
  const d = new Date(t)
  return `${keInputTanggal(t)}T${dua(d.getHours())}:${dua(d.getMinutes())}`
}
export const dariInput = (s: string) => new Date(s).getTime()

export function jenisMakanSaatIni(t = Date.now()) {
  const j = new Date(t).getHours()
  if (j < 10) return 'Sarapan' as const
  if (j < 15) return 'Makan Siang' as const
  if (j < 20) return 'Makan Malam' as const
  return 'Camilan' as const
}
