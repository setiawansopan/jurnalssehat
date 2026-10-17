import { useState } from 'react'
import { db, type Berat } from '../db'
import { adaKomposisi, METRIK_TAMBAHAN, type KunciMetrik } from '../lib/komposisi'
import { dariInput, keInputWaktu } from '../lib/tanggal'
import { Field, inputCls, Sheet, Tombol } from './ui'

const keAngka = (s: string) => {
  const n = parseFloat(s.replace(',', '.'))
  return n > 0 ? n : undefined
}

export default function FormBerat({ awal, waktuAwal, onTutup }: { awal?: Berat; waktuAwal: number; onTutup: () => void }) {
  const [waktu, setWaktu] = useState(keInputWaktu(awal?.waktu ?? waktuAwal))
  const [kg, setKg] = useState(awal?.kg.toString().replace('.', ',') ?? '')
  const [komp, setKomp] = useState<Partial<Record<KunciMetrik, string>>>(() =>
    Object.fromEntries(METRIK_TAMBAHAN.filter((m) => awal?.[m.kunci] !== undefined).map((m) => [m.kunci, String(awal![m.kunci]).replace('.', ',')])),
  )
  const [catatan, setCatatan] = useState(awal?.catatan ?? '')

  async function simpan(e: React.FormEvent) {
    e.preventDefault()
    const nilai = keAngka(kg)
    if (!nilai) return
    const data: Berat = { waktu: dariInput(waktu), kg: Math.round(nilai * 10) / 10, catatan: catatan.trim() || undefined }
    for (const m of METRIK_TAMBAHAN) {
      const v = keAngka(komp[m.kunci] ?? '')
      if (v !== undefined) data[m.kunci] = m.desimal === 0 ? Math.round(v) : Math.round(v * 10) / 10
    }
    // put() menimpa seluruh data, jadi kolom yang dikosongkan ikut terhapus.
    if (awal?.id) await db.berat.put({ ...data, id: awal.id })
    else await db.berat.add(data)
    onTutup()
  }

  async function hapus() {
    if (awal?.id && confirm('Hapus catatan berat badan ini?')) {
      await db.berat.delete(awal.id)
      onTutup()
    }
  }

  return (
    <Sheet judul={awal ? 'Ubah berat & komposisi' : 'Catat berat & komposisi'} onTutup={onTutup}>
      <form onSubmit={simpan} className="space-y-4">
        <Field label="Waktu">
          <input type="datetime-local" required className={inputCls} value={waktu} onChange={(e) => setWaktu(e.target.value)} />
        </Field>
        <Field label="Berat badan (kg)" hint="Timbang di waktu yang sama (mis. pagi, sebelum makan) agar perbandingannya adil.">
          <input required autoFocus inputMode="decimal" className={inputCls} placeholder="mis. 78,5" value={kg} onChange={(e) => setKg(e.target.value)} />
        </Field>

        <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3" open={!!awal && adaKomposisi(awal)}>
          <summary className="cursor-pointer select-none text-sm font-bold uppercase tracking-wide text-zinc-700">
            Komposisi tubuh <span className="font-normal normal-case text-zinc-500">· dari klinik, opsional</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {METRIK_TAMBAHAN.map((m) => (
              <Field key={m.kunci} label={`${m.label} (${m.satuan})`}>
                <input
                  inputMode="decimal"
                  className={inputCls}
                  value={komp[m.kunci] ?? ''}
                  onChange={(e) => setKomp({ ...komp, [m.kunci]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Isi yang tersedia saja. Nama dan satuan bisa berbeda antar-alat; ikuti hasil cetak dari klinik.</p>
        </details>

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
