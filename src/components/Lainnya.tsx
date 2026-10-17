import { useRef, useState } from 'react'
import { bacaPengaturan, db, simpanPengaturan, TARGET_MENIT_PEKAN_BAWAAN } from '../db'
import { blobKeDataUrl, dataUrlKeBlob } from '../lib/foto'
import { rincianMakan } from '../lib/makan'
import { METRIK_TAMBAHAN } from '../lib/komposisi'
import { keInputTanggal, labelJam, tambahHari } from '../lib/tanggal'
import Laporan from './Laporan'
import { Field, inputCls, Tombol } from './ui'

function unduh(nama: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const csvSel = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export default function Lainnya() {
  const awal = bacaPengaturan()
  const [targetMenit, setTargetMenit] = useState(awal.targetMenitPekan.toString())
  const [tinggi, setTinggi] = useState(awal.tinggi?.toString() ?? '')
  const [targetKalori, setTargetKalori] = useState(awal.targetKalori?.toString() ?? '')
  const [targetBerat, setTargetBerat] = useState(awal.targetBerat?.toString() ?? '')
  const [tersimpan, setTersimpan] = useState(false)
  const [dari, setDari] = useState(keInputTanggal(tambahHari(Date.now(), -6)))
  const [sampai, setSampai] = useState(keInputTanggal(Date.now()))
  const [laporan, setLaporan] = useState(false)
  const [pesan, setPesan] = useState('')
  const berkas = useRef<HTMLInputElement>(null)

  const rentang = () => ({ a: new Date(`${dari}T00:00:00`).getTime(), z: new Date(`${sampai}T23:59:59`).getTime() })

  function simpanTarget(e: React.FormEvent) {
    e.preventDefault()
    simpanPengaturan({
      targetMenitPekan: Number(targetMenit) || TARGET_MENIT_PEKAN_BAWAAN,
      tinggi: parseFloat(tinggi.replace(',', '.')) || undefined,
      targetKalori: Number(targetKalori) || undefined,
      targetBerat: parseFloat(targetBerat.replace(',', '.')) || undefined,
    })
    setTersimpan(true)
    setTimeout(() => setTersimpan(false), 2000)
  }

  async function unduhCsv() {
    const { a, z } = rentang()
    const [m, o, b] = await Promise.all([
      db.makan.where('waktu').between(a, z, true, true).toArray(),
      db.olahraga.where('waktu').between(a, z, true, true).toArray(),
      db.berat.where('waktu').between(a, z, true, true).toArray(),
    ])
    const baris: (string | number | undefined)[][] = [
      ['Tanggal', 'Jam', 'Kategori', 'Jenis', 'Keterangan', 'Porsi/Durasi', 'Kalori (kkal)', 'Berat (kg)', 'Rasa/Intensitas', 'Catatan', ...METRIK_TAMBAHAN.map((k) => `${k.label} (${k.satuan})`)],
    ]
    const tgl = (w: number) => keInputTanggal(w)
    const urut: { w: number; r: (string | number | undefined)[] }[] = [
      ...m.map((x) => ({ w: x.waktu, r: [tgl(x.waktu), labelJam(x.waktu), 'Makan', x.jenis, rincianMakan(x), x.porsi, x.kalori, undefined, x.rasa, x.catatan] })),
      ...o.map((x) => ({ w: x.waktu, r: [tgl(x.waktu), labelJam(x.waktu), 'Olahraga', x.jenis, undefined, `${x.durasi} menit`, x.kalori, undefined, x.intensitas, x.catatan] })),
      ...b.map((x) => ({ w: x.waktu, r: [tgl(x.waktu), labelJam(x.waktu), 'Berat', undefined, undefined, undefined, undefined, x.kg, undefined, x.catatan, ...METRIK_TAMBAHAN.map((k) => x[k.kunci])] })),
    ].sort((p, q) => p.w - q.w)
    urut.forEach((u) => baris.push(u.r))
    const isi = '﻿' + baris.map((r) => r.map(csvSel).join(',')).join('\r\n')
    unduh(`jurnal-sehat_${dari}_${sampai}.csv`, new Blob([isi], { type: 'text/csv;charset=utf-8' }))
  }

  async function cadangkan() {
    const [m, o, b] = await Promise.all([db.makan.toArray(), db.olahraga.toArray(), db.berat.toArray()])
    const ubah = async <T extends { foto?: Blob }>(x: T) => ({ ...x, foto: x.foto ? await blobKeDataUrl(x.foto) : undefined })
    const json = JSON.stringify({
      versi: 1,
      dibuat: new Date().toISOString(),
      pengaturan: bacaPengaturan(),
      makan: await Promise.all(m.map(ubah)),
      olahraga: await Promise.all(o.map(ubah)),
      berat: b,
    })
    unduh(`cadangan-jurnal-sehat_${keInputTanggal(Date.now())}.json`, new Blob([json], { type: 'application/json' }))
    setPesan('Cadangan diunduh. Simpan berkasnya di tempat aman (mis. Google Drive / iCloud).')
  }

  async function pulihkan(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const d = JSON.parse(await f.text())
      if (!Array.isArray(d.makan) || !Array.isArray(d.olahraga) || !Array.isArray(d.berat)) throw new Error()
      if (!confirm('Semua data saat ini akan diganti dengan isi cadangan. Lanjutkan?')) return
      const balik = async (x: { foto?: string }) => ({ ...x, foto: x.foto ? await dataUrlKeBlob(x.foto) : undefined })
      const m = await Promise.all(d.makan.map(balik))
      const o = await Promise.all(d.olahraga.map(balik))
      await db.transaction('rw', db.makan, db.olahraga, db.berat, async () => {
        await Promise.all([db.makan.clear(), db.olahraga.clear(), db.berat.clear()])
        await db.makan.bulkAdd(m)
        await db.olahraga.bulkAdd(o)
        await db.berat.bulkAdd(d.berat)
      })
      if (d.pengaturan) simpanPengaturan(d.pengaturan)
      setPesan('Data berhasil dipulihkan.')
    } catch {
      setPesan('Berkas cadangan tidak valid.')
    }
  }

  const { a, z } = rentang()

  return (
    <div className="space-y-4">
      <Bagian judul="Laporan untuk dokter">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari">
            <input type="date" className={inputCls} value={dari} max={sampai} onChange={(e) => setDari(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <input type="date" className={inputCls} value={sampai} min={dari} onChange={(e) => setSampai(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2">
          <Tombol className="flex-1" onClick={() => setLaporan(true)} disabled={!dari || !sampai}>
            Lihat laporan (PDF)
          </Tombol>
          <Tombol warna="abu" onClick={unduhCsv} disabled={!dari || !sampai}>
            CSV
          </Tombol>
        </div>
        <p className="text-xs text-zinc-500">Di halaman laporan, ketuk “Cetak / Simpan sebagai PDF” lalu pilih “Simpan sebagai PDF” untuk dikirim ke dokter.</p>
      </Bagian>

      <Bagian judul="Target (opsional)">
        <form onSubmit={simpanTarget} className="space-y-3">
          <Field label="Olahraga per pekan (menit)" hint="Bawaan 150 menit sesuai anjuran dokter. Ubah kapan saja jika target dinaikkan.">
            <input required inputMode="numeric" className={inputCls} value={targetMenit} onChange={(e) => setTargetMenit(e.target.value.replace(/[^\d]/g, ''))} />
          </Field>
          <Field label="Tinggi badan (cm)" hint="Opsional, untuk menghitung BMI.">
            <input inputMode="decimal" className={inputCls} value={tinggi} onChange={(e) => setTinggi(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kalori per hari (kkal)">
              <input inputMode="numeric" className={inputCls} value={targetKalori} onChange={(e) => setTargetKalori(e.target.value.replace(/[^\d]/g, ''))} />
            </Field>
            <Field label="Berat target (kg)">
              <input inputMode="decimal" className={inputCls} value={targetBerat} onChange={(e) => setTargetBerat(e.target.value)} />
            </Field>
          </div>
          <Tombol type="submit" warna="abu" className="w-full">
            {tersimpan ? '✓ Tersimpan' : 'Simpan target'}
          </Tombol>
          <p className="text-xs text-zinc-500">Isi sesuai anjuran dokter Anda.</p>
        </form>
      </Bagian>

      <Bagian judul="Cadangan data">
        <p className="text-sm text-zinc-600">
          Data tersimpan hanya di HP ini. Buat cadangan secara berkala agar tidak hilang jika HP rusak, hilang, atau data browser terhapus.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Tombol onClick={cadangkan}>Unduh cadangan</Tombol>
          <Tombol warna="abu" onClick={() => berkas.current?.click()}>
            Pulihkan
          </Tombol>
        </div>
        <input ref={berkas} type="file" accept="application/json,.json" hidden onChange={pulihkan} />
        {pesan && <p className="text-sm text-aksen-700">{pesan}</p>}
      </Bagian>

      <Bagian judul="Pasang di layar utama">
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
          <li>
            <b>Android (Chrome):</b> menu ⋮ → “Instal aplikasi” / “Tambahkan ke layar utama”.
          </li>
          <li>
            <b>iPhone (Safari):</b> tombol Bagikan → “Tambah ke Layar Utama”. Buka lewat ikon tersebut agar data lebih awet.
          </li>
        </ul>
      </Bagian>

      {laporan && <Laporan dari={a} sampai={z} onTutup={() => setLaporan(false)} />}
    </div>
  )
}

const Bagian = ({ judul, children }: { judul: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
    <h2 className="judul-sport text-sm">{judul}</h2>
    {children}
  </section>
)
