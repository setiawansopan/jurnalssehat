import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { bacaPengaturan, db, type Berat, type Makan, type Olahraga } from '../db'
import { fmt, hitungBmi, labelBmi, METRIK_TAMBAHAN } from '../lib/komposisi'
import { akhirHari, awalHari, labelJam, labelTanggal, tambahHari } from '../lib/tanggal'
import { statDetail } from '../lib/olahraga'
import { Ikon, KATEGORI } from './Ikon'
import KartuPekan from './KartuPekan'
import { Foto } from './ui'

type Item =
  | { tipe: 'makan'; waktu: number; data: Makan }
  | { tipe: 'olahraga'; waktu: number; data: Olahraga }
  | { tipe: 'berat'; waktu: number; data: Berat }

export interface PanggilEdit {
  makan: (d: Makan) => void
  olahraga: (d: Olahraga) => void
  berat: (d?: Berat) => void
}

export default function HariIni({ hari, setHari, edit }: { hari: number; setHari: (t: number) => void; edit: PanggilEdit }) {
  const [pengaturan] = useState(bacaPengaturan)
  const data = useLiveQuery(async () => {
    const dari = awalHari(hari)
    const sampai = akhirHari(hari)
    const [m, o, b] = await Promise.all([
      db.makan.where('waktu').between(dari, sampai, true, true).toArray(),
      db.olahraga.where('waktu').between(dari, sampai, true, true).toArray(),
      db.berat.where('waktu').between(dari, sampai, true, true).sortBy('waktu'),
    ])
    return { m, o, b }
  }, [hari])

  const adalahHariIni = awalHari(hari) === awalHari(Date.now())
  const item: Item[] = data
    ? [
        ...data.m.map((d) => ({ tipe: 'makan' as const, waktu: d.waktu, data: d })),
        ...data.o.map((d) => ({ tipe: 'olahraga' as const, waktu: d.waktu, data: d })),
        ...data.b.map((d) => ({ tipe: 'berat' as const, waktu: d.waktu, data: d })),
      ].sort((a, b) => a.waktu - b.waktu)
    : []

  const masuk = data?.m.reduce((s, x) => s + (x.kalori ?? 0), 0) ?? 0
  const keluar = data?.o.reduce((s, x) => s + (x.kalori ?? 0), 0) ?? 0
  const menit = data?.o.reduce((s, x) => s + x.durasi, 0) ?? 0
  const berat = data?.b.length ? data.b[data.b.length - 1].kg : undefined
  const persenKalori = pengaturan.targetKalori ? Math.min(100, Math.round((masuk / pengaturan.targetKalori) * 100)) : undefined
  const lewatTarget = pengaturan.targetKalori ? masuk > pengaturan.targetKalori : false

  return (
    <div>
      <div className="flex items-center justify-between">
        <button onClick={() => setHari(tambahHari(hari, -1))} className="rounded-full p-2.5 text-zinc-700 active:bg-zinc-200" aria-label="Hari sebelumnya">
          <Ikon nama="kiri" />
        </button>
        <button onClick={() => setHari(Date.now())} className="text-center">
          <div className="label-kecil !text-aksen-600">{adalahHariIni ? 'Hari ini' : 'Ketuk untuk ke hari ini'}</div>
          <div className="font-extrabold">{labelTanggal(hari)}</div>
        </button>
        <button
          onClick={() => setHari(tambahHari(hari, 1))}
          disabled={adalahHariIni}
          className="rounded-full p-2.5 text-zinc-700 active:bg-zinc-200 disabled:opacity-25"
          aria-label="Hari berikutnya"
        >
          <Ikon nama="kanan" />
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl bg-malam p-4 text-white shadow-lg">
        <div className="grid grid-cols-3 gap-2">
          <Skor judul="Masuk" nilai={masuk} satuan="kkal" />
          <Skor judul="Olahraga" nilai={menit} satuan="menit" aksen />
          <Skor judul="Berat" nilai={berat !== undefined ? fmt(berat) : '–'} satuan="kg" />
        </div>
        {(persenKalori !== undefined || keluar > 0) && (
          <div className="mt-4 space-y-2">
            {persenKalori !== undefined && (
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className={`h-full rounded-full ${lewatTarget ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${persenKalori}%` }} />
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {masuk} / {pengaturan.targetKalori} kkal target harian
                </div>
              </div>
            )}
            {keluar > 0 && <div className="text-xs text-white/60">±{keluar} kkal terbakar dari olahraga</div>}
          </div>
        )}
      </div>

      <KartuPekan onCatatBerat={() => edit.berat()} />

      <h2 className="label-kecil mb-2 mt-5 px-1">Aktivitas</h2>
      <div className="space-y-3">
        {data && item.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            <Ikon nama="olahraga" className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
            Belum ada catatan.
            <br />
            Ketuk tombol <b className="text-aksen-600">+</b> untuk mulai.
          </div>
        )}
        {item.map((it) => (
          <KartuItem key={`${it.tipe}-${it.data.id}`} it={it} edit={edit} tinggi={pengaturan.tinggi} />
        ))}
      </div>
    </div>
  )
}

function Skor({ judul, nilai, satuan, aksen }: { judul: string; nilai: number | string; satuan: string; aksen?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${aksen ? 'bg-aksen-500' : 'bg-malam-2'}`}>
      <div className={`label-kecil !text-[10px] ${aksen ? '!text-white/80' : '!text-white/50'}`}>{judul}</div>
      <div className="angka mt-1.5 text-[28px]">{nilai}</div>
      <div className={`mt-0.5 text-xs ${aksen ? 'text-white/80' : 'text-white/50'}`}>{satuan}</div>
    </div>
  )
}

function Stat({ label, nilai, satuan }: { label: string; nilai: string | number; satuan?: string }) {
  return (
    <div className="min-w-0">
      <div className="label-kecil !text-[10px]">{label}</div>
      <div className={`angka mt-1 break-words pb-0.5 leading-tight ${typeof nilai === 'number' || /^[\d.,:±]+$/.test(nilai) ? 'text-xl' : 'text-base'}`}>
        {nilai}
        {satuan && <span className="ml-1 text-xs font-semibold text-zinc-400">{satuan}</span>}
      </div>
    </div>
  )
}

function KartuItem({ it, edit, tinggi }: { it: Item; edit: PanggilEdit; tinggi?: number }) {
  const kat = KATEGORI[it.tipe]
  let judul = ''
  let sub = ''
  let stat: { label: string; nilai: string | number; satuan?: string }[] = []
  let foto: Blob | undefined
  let catatan: string | undefined
  let rincian: { nama: string; porsi: string; kalori?: number }[] | undefined

  if (it.tipe === 'makan') {
    const d = it.data
    judul = d.nama
    sub = d.jenis
    stat = [
      ...(d.kalori ? [{ label: 'Kalori', nilai: d.kalori, satuan: 'kkal' }] : []),
      ...(d.porsi && !(d.items && d.items.length > 1) ? [{ label: 'Porsi', nilai: d.porsi }] : []),
      ...(d.rasa ? [{ label: 'Rasa', nilai: d.rasa }] : []),
    ]
    rincian = d.items && d.items.length > 1 ? d.items : undefined
    foto = d.foto
    catatan = d.catatan
  } else if (it.tipe === 'olahraga') {
    const d = it.data
    judul = d.jenis
    sub = `Olahraga · ${d.intensitas}`
    stat = [
      { label: 'Durasi', nilai: d.durasi, satuan: 'menit' },
      ...(d.kalori ? [{ label: 'Terbakar', nilai: `±${d.kalori}`, satuan: 'kkal' }] : []),
      { label: 'Intensitas', nilai: d.intensitas },
      ...statDetail(d),
    ]
    foto = d.foto
    catatan = d.catatan
  } else {
    const d = it.data
    const bmi = hitungBmi(d.kg, tinggi)
    judul = 'Berat & komposisi'
    sub = 'Timbang'
    stat = [
      { label: 'Berat', nilai: fmt(d.kg), satuan: 'kg' },
      ...(bmi ? [{ label: `BMI · ${labelBmi(bmi)}`, nilai: fmt(bmi) }] : []),
      ...METRIK_TAMBAHAN.filter((m) => d[m.kunci] !== undefined).map((m) => ({ label: m.pendek, nilai: fmt(d[m.kunci]!, m.desimal), satuan: m.satuan === 'level' ? '' : m.satuan })),
    ]
    catatan = d.catatan
  }

  function buka() {
    if (it.tipe === 'makan') edit.makan(it.data)
    else if (it.tipe === 'olahraga') edit.olahraga(it.data)
    else edit.berat(it.data)
  }

  return (
    <button onClick={buka} className="block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-zinc-200/70 active:bg-zinc-50">
      <div className="flex items-center gap-3 p-3.5 pb-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${kat.warna}`}>
          <Ikon nama={kat.ikon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold leading-tight">{judul}</div>
          <div className="text-xs text-zinc-500">
            {labelJam(it.waktu)} · {sub}
          </div>
        </div>
      </div>
      {stat.length > 0 && (
        <div className={`grid gap-x-3 gap-y-3 border-t border-zinc-100 px-3.5 py-3 ${stat.length === 1 ? 'grid-cols-1' : stat.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {stat.map((s) => (
            <Stat key={s.label} {...s} />
          ))}
        </div>
      )}
      {rincian && (
        <ul className="space-y-1 border-t border-zinc-100 px-3.5 py-2.5 text-sm">
          {rincian.map((i, n) => (
            <li key={n} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                {i.nama} {i.porsi && <span className="text-zinc-400">· {i.porsi}</span>}
              </span>
              {i.kalori ? <span className="shrink-0 text-zinc-500">{i.kalori} kkal</span> : null}
            </li>
          ))}
        </ul>
      )}
      {foto && <Foto blob={foto} className="h-48 w-full" />}
      {catatan && <p className="border-t border-zinc-100 px-3.5 py-2.5 text-sm text-zinc-600">{catatan}</p>}
    </button>
  )
}
