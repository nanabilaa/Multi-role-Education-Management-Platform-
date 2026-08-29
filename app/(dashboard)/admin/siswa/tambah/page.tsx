import Link from 'next/link'
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Layers3,
  MapPin,
  School,
  UserRound,
  UsersRound,
} from 'lucide-react'

import SubmitButton from './SubmitButton'
import { handleSubmit } from './actions'

const paketOptions = [
  { value: 'reguler', label: 'Reguler' },
  { value: 'intensif', label: 'Intensif' },
  { value: 'utbk', label: 'UTBK' },
] as const

export default function TambahSiswaPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        <section className="overflow-hidden rounded-3xl border border-[#DDE7E2] bg-[#0B513B] shadow-[0_10px_30px_rgba(15,61,46,0.08)]">
          <div className="p-6 sm:p-8">
            <Link
              href="/admin/siswa"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>

            <div className="mt-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <GraduationCap className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[34px]">
                  Tambah Siswa
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  Lengkapi data siswa, paket belajar, dan informasi orang tua.
                </p>
              </div>
            </div>
          </div>
        </section>

        <form action={handleSubmit} className="space-y-5">
          <FormCard
            icon={<UserRound className="h-5 w-5" />}
            title="Data Siswa"
            description="Isi identitas utama siswa."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nama Siswa"
                htmlFor="nama"
                required
              >
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  required
                  autoComplete="name"
                  className="input-style"
                  placeholder="Contoh: Alya Putri"
                />
              </Field>

              <Field
                label="Kelas"
                htmlFor="kelas"
                required
              >
                <input
                  id="kelas"
                  name="kelas"
                  type="text"
                  required
                  className="input-style"
                  placeholder="Contoh: 5A atau Kelas 8"
                />
              </Field>

              <Field
                label="Sekolah"
                htmlFor="sekolah"
                required
              >
                <InputWithIcon
                  icon={<School className="h-4 w-4" />}
                >
                  <input
                    id="sekolah"
                    name="sekolah"
                    type="text"
                    required
                    className="input-style pl-11"
                    placeholder="Contoh: SMA Negeri 1 Salaman"
                  />
                </InputWithIcon>
              </Field>

              <Field
                label="Paket Belajar"
                htmlFor="paket"
                required
              >
                <InputWithIcon
                  icon={<Layers3 className="h-4 w-4" />}
                >
                  <select
                    id="paket"
                    name="paket"
                    required
                    defaultValue=""
                    className="input-style appearance-none pl-11"
                  >
                    <option value="" disabled>
                      Pilih paket
                    </option>

                    {paketOptions.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </InputWithIcon>
              </Field>

              <Field
                label="Tanggal Lahir"
                htmlFor="tanggal_lahir"
              >
                <InputWithIcon
                  icon={<CalendarDays className="h-4 w-4" />}
                >
                  <input
                    id="tanggal_lahir"
                    name="tanggal_lahir"
                    type="date"
                    className="input-style pl-11"
                  />
                </InputWithIcon>
              </Field>

              <div className="hidden sm:block" />
            </div>

            <Field
              label="Alamat"
              htmlFor="alamat"
            >
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />

                <textarea
                  id="alamat"
                  name="alamat"
                  rows={4}
                  className="textarea-style pl-11"
                  placeholder="Masukkan alamat lengkap siswa"
                />
              </div>
            </Field>
          </FormCard>

          <FormCard
            icon={<UsersRound className="h-5 w-5" />}
            title="Data Orang Tua"
            description="Isi nama dan pekerjaan orang tua atau wali."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nama Orang Tua / Wali"
                htmlFor="nama_ortu"
                required
              >
                <InputWithIcon
                  icon={<UserRound className="h-4 w-4" />}
                >
                  <input
                    id="nama_ortu"
                    name="nama_ortu"
                    type="text"
                    required
                    className="input-style pl-11"
                    placeholder="Contoh: Budi Santoso"
                  />
                </InputWithIcon>
              </Field>

              <Field
                label="Pekerjaan Orang Tua / Wali"
                htmlFor="pekerjaan_ortu"
              >
                <InputWithIcon
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                >
                  <input
                    id="pekerjaan_ortu"
                    name="pekerjaan_ortu"
                    type="text"
                    className="input-style pl-11"
                    placeholder="Contoh: Guru"
                  />
                </InputWithIcon>
              </Field>
            </div>
          </FormCard>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/siswa"
                className="inline-flex h-11 min-w-[130px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Batal
              </Link>

              <SubmitButton />
            </div>
          </section>
        </form>
      </div>

      <style>{`
        .input-style {
          height: 2.875rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding-left: 0.875rem;
          padding-right: 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .input-style::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .input-style:focus {
          border-color: #0b513b;
          box-shadow: 0 0 0 3px rgba(11, 81, 59, 0.1);
        }

        .textarea-style {
          width: 100%;
          min-height: 7rem;
          resize: vertical;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.5rem;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .textarea-style::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .textarea-style:focus {
          border-color: #0b513b;
          box-shadow: 0 0 0 3px rgba(11, 81, 59, 0.1);
        }
      `}</style>
    </main>
  )
}

function FormCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0B513B]">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  )
}

function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
        {icon}
      </div>

      {children}
    </div>
  )
}
