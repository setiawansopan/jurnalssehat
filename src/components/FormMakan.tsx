import { useMemo, useState } from 'react'
import { db, JENIS_MAKAN, type JenisMakan, type Makan } from '../db'
import { MAKANAN_UMUM } from '../lib/daftar'
import { dariInput, jenisMakanSaatIni, keInputWaktu } from '../lib/tanggal'
import { Field, FotoInput, inputCls, Pilihan, Sheet, Tombol } from './ui'

const RASA = ['Masih lapar', 'Cukup', 'Kenyang', 'Terlalu kenyang'] as const

export default function FormMakan({ awal, waktuAwal, onTutup }: { awal?: Makan; waktuAwal: number; onTutup: () => void }) {
  const [waktu, setWaktu] = useState(keInputWaktu(awal?.waktu ?? waktuAwal))
  const [jenis, setJenis] = useState<JenisMakan>(awal?.jenis ?? jenisMakanSaatIni(waktuAwal))
  const [nama, setNama] = useState(awal?.nama ?? '')
  const [porsi, setPorsi] = useState(awal?.porsi ?? '')
  const [basis, setBasis] = useState<number>()
  const [jumlah, setJumlah] = useState('1')
  const [kalori, setKalori] = useState(awal?.kalori?.toString() ?? '')
  const [rasa, setRasa] = useState(awal?.rasa ?? '')
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')
  const [foto, setFoto] = useState<Blob | undefined>(awal?.foto)
  const [fokus, setFokus] = useState(false)

  const saran = useMemo(() => {
    const q = nama.trim().toLowerCase()
    if (!q) return []
    return MAKANAN_UMUM.filter((m) => m.nama.toLowerCase().includes(q) && m.nama.toLowerCase() !== q).slice(0, 6)
  }, [nama])

  function pilihSaran(i: number) {
    const m = saran[i]
    setNama(m.nama)
    setPorsi(m.porsi)
    setBasis(m.kalori)
    setJumlah('1')
    setKalori(String(m.kalori))
    setFokus(false)
  }

  function ubahJumlah(v: string) {
    setJumlah(v)
    const n = parseFloat(v.replace(',', '.'))
    if (basis !== undefined && n > 0) setKalori(String(Math.round(basis * n)))
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(jumlah.replace(',', '.'))
    const porsiAkhir = basis !== undefined && n > 0 && n !== 1 ? `${jumlah} × ${porsi}` : porsi.trim()
    const data: Makan = {
      waktu: dariInput(waktu),
      jenis,
      nama: nama.trim(),
      porsi: porsiAkhir,
      kalori: kalori ? Math.round(Number(kalori)) : undefined,
      rasa: rasa || undefined,
      catatan: catatan.trim() || undefined,
      foto,
    }
    if (awal?.id) await db.makan.put({ ...data, id: awal.id })
    else await db.makan.add(data)
    onTutup()
  }

  async function hapus() {
    if (awal?.id && confirm('Hapus catatan makan ini?')) {
      await db.makan.delete(awal.id)
      onTutup()
    }
  }

  return (
    <Sheet judul={awal ? 'Ubah catatan makan' : 'Catat makan'} onTutup={onTutup}>
      <form onSubmit={simpan} className="space-y-4">
        <Field label="Waktu">
          <input type="datetime-local" required className={inputCls} value={waktu} onChange={(e) => setWaktu(e.target.value)} />
        </Field>
        <Pilihan nilai={jenis} opsi={JENIS_MAKAN} onChange={setJenis} />

        <div className="relative">
          <Field label="Makan apa?">
            <input
              required
              className={inputCls}
              placeholder="Ketik, mis. nasi goreng"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value)
                setBasis(undefined)
                setFokus(true)
              }}
              onFocus={() => setFokus(true)}
              onBlur={() => setTimeout(() => setFokus(false), 150)}
            />
          </Field>
          {fokus && saran.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
              {saran.map((m, i) => (
                <li key={m.nama}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pilihSaran(i)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left active:bg-zinc-100"
                  >
                    <span>
                      {m.nama} <span className="text-xs text-zinc-500">· {m.porsi}</span>
                    </span>
                    <span className="text-sm text-zinc-500">{m.kalori} kkal</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Porsi">
            <input className={inputCls} placeholder="1 piring" value={porsi} onChange={(e) => setPorsi(e.target.value)} />
          </Field>
          {basis !== undefined ? (
            <Field label="Jumlah porsi">
              <input inputMode="decimal" className={inputCls} value={jumlah} onChange={(e) => ubahJumlah(e.target.value)} />
            </Field>
          ) : (
            <div />
          )}
        </div>

        <Field label="Kalori (kkal)" hint="Opsional. Angka dari daftar hanyalah perkiraan kasar.">
          <input
            inputMode="numeric"
            className={inputCls}
            value={kalori}
            onChange={(e) => {
              setKalori(e.target.value.replace(/[^\d]/g, ''))
              setBasis(undefined)
            }}
          />
        </Field>

        <FotoInput foto={foto} onChange={setFoto} />

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">Rasa setelah makan</span>
          <div className="flex flex-wrap gap-2">
            {RASA.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRasa(rasa === r ? '' : r)}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${
                  rasa === r ? 'border-aksen-600 bg-aksen-600 text-white' : 'border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Field label="Catatan">
          <textarea rows={2} className={inputCls} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>

        <div className="flex gap-2 pb-2">
          {awal && (
            <Tombol type="button" warna="merah" onClick={hapus}>
              Hapus
            </Tombol>
          )}
          <Tombol type="submit" className="flex-1">
            Simpan
          </Tombol>
        </div>
      </form>
    </Sheet>
  )
}
