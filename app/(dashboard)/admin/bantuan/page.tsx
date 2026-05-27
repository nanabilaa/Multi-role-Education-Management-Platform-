import Link from 'next/link'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MessageCircle,
  RefreshCcw,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react'

type GuideItem = {
  title: string
  desc: string
  icon: React.ReactNode
  steps: string[]
  href?: string
  linkLabel?: string
}

type FaqItem = {
  question: string
  answer: string
}

const quickLinks = [
  {
    title: 'Dashboard',
    desc: 'Lihat ringkasan siswa, sesi, jurnal, dan SPP.',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Siswa',
    desc: 'Kelola data siswa dan orang tua.',
    href: '/admin/siswa',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Jadwal',
    desc: 'Buat dan pantau sesi bimbel.',
    href: '/admin/jadwal',
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    title: 'Jurnal',
    desc: 'Cek laporan dan progres dari tentor.',
    href: '/admin/jurnal',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: 'Keuangan',
    desc: 'Tagihan, pembayaran, invoice, dan laporan.',
    href: '/admin/dana',
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    title: 'Pengaturan',
    desc: 'Profil admin, bimbel, tentor, dan reset data.',
    href: '/admin/pengaturan',
    icon: <Settings className="h-5 w-5" />,
  },
]

const guideItems: GuideItem[] = [
  {
    title: 'Dashboard Admin',
    desc: 'Dipakai untuk melihat kondisi bimbel secara cepat.',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/admin',
    linkLabel: 'Buka Dashboard',
    steps: [
      'Cek total siswa aktif.',
      'Cek sesi hari ini.',
      'Cek status SPP bulan berjalan.',
      'Cek jurnal yang sudah atau belum dikirim tentor.',
    ],
  },
  {
    title: 'Kelola Siswa',
    desc: 'Dipakai untuk menambah, mengubah, dan menonaktifkan siswa.',
    icon: <Users className="h-5 w-5" />,
    href: '/admin/siswa',
    linkLabel: 'Buka Siswa',
    steps: [
      'Tambah data siswa baru.',
      'Isi nama, kelas, sekolah, dan data orang tua.',
      'Gunakan edit kalau ada data yang salah.',
      'Nonaktifkan siswa jika sudah berhenti, jangan langsung hapus kalau masih butuh riwayat.',
    ],
  },
  {
    title: 'Jadwal Sesi',
    desc: 'Dipakai untuk membuat jadwal belajar dan memilih tentor.',
    icon: <CalendarDays className="h-5 w-5" />,
    href: '/admin/jadwal',
    linkLabel: 'Buka Jadwal',
    steps: [
      'Pilih tanggal, jam mulai, durasi, mapel, dan tentor.',
      'Tambahkan siswa yang ikut sesi.',
      'Pastikan jadwal tidak bentrok.',
      'Setelah sesi selesai, tentor bisa mengisi jurnal.',
    ],
  },
  {
    title: 'Jurnal & Presensi',
    desc: 'Dipakai untuk mengecek laporan pembelajaran dari tentor.',
    icon: <ClipboardList className="h-5 w-5" />,
    href: '/admin/jurnal',
    linkLabel: 'Buka Jurnal',
    steps: [
      'Cari jurnal berdasarkan tanggal, status, mapel, tentor, atau siswa.',
      'Klik detail untuk membuka isi jurnal.',
      'Cek catatan umum dari tentor.',
      'Cek progres tiap siswa melalui dropdown murid.',
    ],
  },
  {
    title: 'Keuangan / Dana',
    desc: 'Dipakai untuk mengelola tagihan, pembayaran cash, invoice, dan laporan.',
    icon: <CreditCard className="h-5 w-5" />,
    href: '/admin/dana',
    linkLabel: 'Buka Keuangan',
    steps: [
      'Generate tagihan SPP siswa.',
      'Validasi pembayaran secara manual karena pembayaran dilakukan cash.',
      'Gunakan tombol lunas jika sudah bayar.',
      'Gunakan undo jika tidak sengaja menandai lunas.',
      'Download invoice atau laporan Excel jika dibutuhkan.',
    ],
  },
  {
    title: 'Pengaturan Admin',
    desc: 'Dipakai untuk mengatur identitas bimbel, profil admin, anggota tentor, dan reset data.',
    icon: <Settings className="h-5 w-5" />,
    href: '/admin/pengaturan',
    linkLabel: 'Buka Pengaturan',
    steps: [
      'Ubah nama dan nomor HP admin.',
      'Ubah data identitas bimbel.',
      'Tambah, edit, aktifkan, nonaktifkan, atau hapus anggota tentor.',
      'Gunakan reset cache kalau tampilan terasa error.',
      'Gunakan reset semua data hanya kalau benar-benar ingin mengosongkan sistem.',
    ],
  },
]

const faqItems: FaqItem[] = [
  {
    question: 'Kenapa admin malah masuk ke halaman ortu?',
    answer:
      'Biasanya role di tabel profiles belum admin. Cek data akun di tabel profiles, pastikan kolom role bernilai admin.',
  },
  {
    question: 'Kenapa tidak bisa login?',
    answer:
      'Cek email dan password. Kalau login berhasil tapi mental ke login lagi, biasanya session Supabase atau role profile bermasalah.',
  },
  {
    question: 'Kenapa data tidak muncul?',
    answer:
      'Pastikan tabel sudah ada, RLS policy sudah benar, dan akun yang login punya role admin.',
  },
  {
    question: 'Kenapa SPP belum berubah lunas?',
    answer:
      'Cek apakah tombol validasi pembayaran sudah ditekan. Kalau pembayaran dicicil, pastikan total cicilan sudah mencapai nominal tagihan.',
  },
  {
    question: 'Kalau salah pencet lunas gimana?',
    answer:
      'Gunakan tombol undo atau ubah kembali status menjadi belum lunas di halaman dana.',
  },
  {
    question: 'Kenapa download Excel tidak jalan?',
    answer:
      'Pastikan library Excel dan file-saver sudah benar. Kalau error saveAs, biasanya import file-saver masih salah atau package belum terinstall.',
  },
  {
    question: 'Apa yang harus dikirim kalau lapor error?',
    answer:
      'Kirim screenshot error, URL halaman, email akun, role akun, jam kejadian, dan langkah sebelum error muncul.',
  },
]

export default function AdminBantuanPage() {
  return (
    <main className="min-h-screen bg-[#FAFBF7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[32px] border border-[#E7EFE6] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
                <LifeBuoy className="h-4 w-4" />
                Admin · Bantuan
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Pusat Bantuan Admin
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                Panduan cepat untuk mengelola siswa, jadwal, jurnal, pembayaran,
                laporan, pengaturan, dan pengecekan error di CBS System.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#E7EFE6] bg-[#F8FAF7] p-4">
              <p className="text-xs font-bold text-slate-400">
                Mode bantuan
              </p>
              <p className="mt-1 text-2xl font-black text-[#063D27]">
                Admin
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Butuh Cepat?"
            desc="Gunakan menu bantuan ini untuk cek alur kerja utama admin."
            icon={<HelpCircle className="h-5 w-5" />}
          />

          <InfoCard
            title="Kontak Internal"
            desc="Hubungi admin utama jika akun, role, atau data tidak sesuai."
            icon={<MessageCircle className="h-5 w-5" />}
          />

          <InfoCard
            title="Lapor Error"
            desc="Siapkan screenshot, URL halaman, email akun, dan langkah kejadian."
            icon={<ShieldAlert className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-[#063D27]">
                Akses Cepat
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Lompat langsung ke halaman admin yang sering dipakai.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[24px] border border-[#E7EFE6] bg-[#FAFBF7] p-4 transition hover:border-[#DDE9DB] hover:bg-[#F3F8F1]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#063D27] ring-1 ring-[#E7EFE6]">
                    {item.icon}
                  </div>

                  <div>
                    <p className="font-black text-[#063D27]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#063D27]">
                  Panduan Berdasarkan Menu
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Detail dibuat dropdown supaya halaman tetap tenang dan tidak penuh.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {guideItems.map((item) => (
                <GuideAccordion key={item.title} item={item} />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#FFFBEA] text-[#7A5C00] ring-1 ring-[#EFE6BF]">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-[#063D27]">
                    Checklist Sebelum Lapor Error
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Kirim data ini supaya error cepat dicek.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  'Screenshot error yang muncul.',
                  'URL halaman saat error terjadi.',
                  'Email akun yang digunakan login.',
                  'Role akun: admin / tentor / ortu.',
                  'Jam kejadian error.',
                  'Langkah terakhir sebelum error muncul.',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[20px] border border-[#E7EFE6] bg-[#FAFBF7] p-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#063D27]" />
                    <p className="text-sm font-semibold leading-6 text-slate-600">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
                  <Mail className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-[#063D27]">
                    Template Lapor Error
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Bisa copy format ini saat lapor.
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#E7EFE6] bg-[#FAFBF7] p-4 text-sm font-semibold leading-7 text-slate-600">
                <p>Error:</p>
                <p>Halaman:</p>
                <p>Email akun:</p>
                <p>Role akun:</p>
                <p>Jam kejadian:</p>
                <p>Langkah sebelum error:</p>
                <p>Screenshot:</p>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
              <RefreshCcw className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-[#063D27]">
                FAQ Admin
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Pertanyaan yang paling sering muncul saat pakai sistem.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {faqItems.map((item) => (
              <FaqAccordion key={item.question} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoCard({
  title,
  desc,
  icon,
}: {
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-[#E7EFE6] bg-white p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
        {icon}
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {desc}
      </p>
    </div>
  )
}

function GuideAccordion({ item }: { item: GuideItem }) {
  return (
    <details className="group rounded-[24px] border border-[#E7EFE6] bg-[#FAFBF7]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#063D27] ring-1 ring-[#E7EFE6]">
            {item.icon}
          </div>

          <div className="min-w-0">
            <p className="font-black text-[#063D27]">{item.title}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              {item.desc}
            </p>
          </div>
        </div>

        <ChevronDown className="h-5 w-5 shrink-0 text-[#063D27] transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#E7EFE6] px-4 pb-4 pt-3">
        <div className="space-y-2">
          {item.steps.map((step) => (
            <div key={step} className="flex gap-3">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#063D27]" />
              <p className="text-sm font-semibold leading-6 text-slate-600">
                {step}
              </p>
            </div>
          ))}
        </div>

        {item.href && (
          <Link
            href={item.href}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-[#DDE9DB] bg-white px-4 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
          >
            {item.linkLabel || 'Buka Halaman'}
          </Link>
        )}
      </div>
    </details>
  )
}

function FaqAccordion({ item }: { item: FaqItem }) {
  return (
    <details className="group rounded-[22px] border border-[#E7EFE6] bg-[#FAFBF7]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden">
        <p className="text-sm font-black text-[#063D27]">
          {item.question}
        </p>

        <ChevronDown className="h-4 w-4 shrink-0 text-[#063D27] transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#E7EFE6] px-4 pb-4 pt-3">
        <p className="text-sm font-semibold leading-7 text-slate-600">
          {item.answer}
        </p>
      </div>
    </details>
  )
}