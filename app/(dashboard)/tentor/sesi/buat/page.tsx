import Link from 'next/link'
import Script from 'next/script'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Save,
  Search,
  UsersRound,
  X,
} from 'lucide-react'

type SiswaRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  aktif: boolean | null
}

async function getSiswaAktif() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('siswa')
    .select('id, nama, kelas, sekolah, aktif')
    .eq('aktif', true)
    .order('nama', { ascending: true })

  if (error) {
    console.log('GET SISWA AKTIF ERROR:', error)
    return []
  }

  return (data ?? []) as SiswaRow[]
}

export default async function BuatSesiTentorPage() {
  const siswaList = await getSiswaAktif()

  async function handleCreateSesi(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const tanggal = String(formData.get('tanggal') || '').trim()
    const jamMulai = String(formData.get('jam_mulai') || '').trim()
    const durasi = Number(formData.get('durasi') || 60)
    const mapel = String(formData.get('mapel') || '').trim()
    const siswaIds = formData
      .getAll('siswa_ids')
      .map((item) => String(item))
      .filter(Boolean)

    if (!tanggal || !jamMulai || !mapel) {
      throw new Error('Tanggal, jam mulai, dan mapel wajib diisi.')
    }

    if (siswaIds.length === 0) {
      throw new Error('Pilih minimal satu siswa.')
    }

    const { data: sesiBaru, error: sesiError } = await supabase
      .from('sesi')
      .insert({
        tentor_id: user.id,
        tanggal,
        jam_mulai: jamMulai,
        durasi,
        mapel,
        status: 'terjadwal',
      })
      .select('id')
      .single()

    if (sesiError || !sesiBaru) {
      throw new Error(
        'Gagal menambahkan sesi: ' + (sesiError?.message || 'Sesi gagal dibuat')
      )
    }

    const relasiPayload = siswaIds.map((siswaId) => ({
      sesi_id: sesiBaru.id,
      siswa_id: siswaId,
      hadir: null,
      materi: null,
      deskripsi: null,
    }))

    const { error: relasiError } = await supabase
      .from('sesi_siswa')
      .insert(relasiPayload)

    if (relasiError) {
      await supabase.from('sesi').delete().eq('id', sesiBaru.id)

      throw new Error(
        'Sesi dibuat, tapi gagal menambahkan siswa: ' + relasiError.message
      )
    }

    revalidatePath('/tentor')
    revalidatePath('/tentor/sesi')
    revalidatePath('/tentor/jurnal')
    revalidatePath('/admin')
    revalidatePath('/admin/jadwal')
    revalidatePath('/ortu/dashboard')
    revalidatePath('/ortu/jadwal')

    redirect('/tentor/sesi')
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <Link
            href="/tentor/sesi"
            className="mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-4 text-xs font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-bold text-[#063D27]">
                <CalendarDays className="h-4 w-4" />
                Buat Jadwal
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Buat Sesi Baru
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Isi jadwal mengajar. Pilih siswa lewat daftar checkbox di bawah.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Siswa Aktif
              </p>
              <p className="mt-1 text-3xl font-black text-[#063D27]">
                {siswaList.length}
              </p>
            </div>
          </div>
        </section>

        <form
          action={handleCreateSesi}
          className="grid gap-5 lg:grid-cols-[1fr_340px]"
        >
          <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5 sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#063D27]">
                  Detail Sesi
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                  Tentukan tanggal, jam, durasi, dan mata pelajaran.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="tanggal"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Tanggal <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="tanggal"
                    name="tanggal"
                    type="date"
                    required
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="jam_mulai"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="jam_mulai"
                    name="jam_mulai"
                    type="time"
                    required
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="durasi"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Durasi
                  </label>

                  <select
                    id="durasi"
                    name="durasi"
                    defaultValue="60"
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  >
                    <option value="60">60 menit</option>
                    <option value="70">70 menit</option>
                    <option value="90">90 menit</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mapel"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Mapel <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="mapel"
                    name="mapel"
                    type="text"
                    required
                    placeholder="Contoh: Matematika"
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                <UsersRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#063D27]">
                  Pilih Siswa
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                  Minimal pilih satu siswa.
                </p>
              </div>
            </div>

            {siswaList.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-8 text-center">
                <p className="text-sm font-bold text-slate-400">
                  Belum ada siswa aktif.
                </p>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="cari-siswa"
                    type="search"
                    placeholder="Cari nama, kelas, atau sekolah..."
                    autoComplete="off"
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] pl-11 pr-11 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />

                  <button
                    id="hapus-cari-siswa"
                    type="button"
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#EEF3EC] hover:text-[#063D27]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <p
                    id="hasil-cari-siswa"
                    className="text-xs font-bold text-slate-400"
                  >
                    {siswaList.length} siswa ditampilkan
                  </p>

                  <div className="rounded-full bg-[#F3F8F1] px-3 py-1.5 text-xs font-black text-[#063D27]">
                    <span id="jumlah-siswa-dipilih">0</span> dipilih
                  </div>
                </div>

                <div
                  id="daftar-siswa"
                  className="max-h-[420px] space-y-2 overflow-y-auto pr-1"
                >
                  {siswaList.map((siswa) => (
                    <label
                      key={siswa.id}
                      data-siswa-item
                      data-search={`${siswa.nama} ${siswa.kelas ?? ''} ${siswa.sekolah ?? ''}`.toLowerCase()}
                      className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-[#EEF3EC] bg-[#FAFCF9] p-3 transition hover:border-[#DDE9DB] hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        name="siswa_ids"
                        value={siswa.id}
                        data-siswa-checkbox
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#063D27]"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-black text-[#063D27]">
                          {siswa.nama}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">
                          {siswa.kelas ?? '-'} · {siswa.sekolah ?? '-'}
                        </p>
                      </div>
                    </label>
                  ))}

                  <div
                    id="siswa-tidak-ditemukan"
                    className="hidden rounded-[20px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-4 py-8 text-center"
                  >
                    <Search className="mx-auto h-5 w-5 text-slate-300" />
                    <p className="mt-2 text-sm font-black text-slate-500">
                      Siswa tidak ditemukan
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Coba kata pencarian lain.
                    </p>
                  </div>
                </div>

                <Script id="cbs-siswa-search" strategy="afterInteractive">
                  {`
                    (() => {
                      if (window.__cbsSiswaSearchReady) return;
                      window.__cbsSiswaSearchReady = true;

                      const normalizeText = (value) =>
                        String(value || '')
                          .toLocaleLowerCase('id-ID')
                          .trim();

                      const getElements = () => ({
                        input: document.getElementById('cari-siswa'),
                        clearButton: document.getElementById('hapus-cari-siswa'),
                        resultText: document.getElementById('hasil-cari-siswa'),
                        selectedText: document.getElementById('jumlah-siswa-dipilih'),
                        emptyState: document.getElementById('siswa-tidak-ditemukan'),
                        items: Array.from(
                          document.querySelectorAll('[data-siswa-item]')
                        ),
                        checkboxes: Array.from(
                          document.querySelectorAll('[data-siswa-checkbox]')
                        ),
                      });

                      const updateSearch = () => {
                        const {
                          input,
                          clearButton,
                          resultText,
                          emptyState,
                          items,
                        } = getElements();

                        if (!input) return;

                        const keyword = normalizeText(input.value);
                        let visible = 0;

                        items.forEach((item) => {
                          const haystack = normalizeText(
                            item.getAttribute('data-search')
                          );

                          const match =
                            keyword.length === 0 ||
                            haystack.includes(keyword);

                          item.style.display = match ? 'flex' : 'none';

                          if (match) {
                            visible += 1;
                          }
                        });

                        if (resultText) {
                          resultText.textContent =
                            visible + ' siswa ditampilkan';
                        }

                        if (emptyState) {
                          emptyState.style.display =
                            visible === 0 ? 'block' : 'none';
                        }

                        if (clearButton) {
                          clearButton.style.display =
                            keyword.length > 0 ? 'flex' : 'none';
                        }
                      };

                      const updateSelected = () => {
                        const {
                          selectedText,
                          checkboxes,
                        } = getElements();

                        const total = checkboxes.filter(
                          (checkbox) => checkbox.checked
                        ).length;

                        if (selectedText) {
                          selectedText.textContent = String(total);
                        }

                        checkboxes.forEach((checkbox) => {
                          const card = checkbox.closest('[data-siswa-item]');

                          if (!card) return;

                          if (checkbox.checked) {
                            card.classList.remove(
                              'border-[#EEF3EC]',
                              'bg-[#FAFCF9]'
                            );
                            card.classList.add(
                              'border-[#9FC39C]',
                              'bg-[#F3F8F1]'
                            );
                          } else {
                            card.classList.remove(
                              'border-[#9FC39C]',
                              'bg-[#F3F8F1]'
                            );
                            card.classList.add(
                              'border-[#EEF3EC]',
                              'bg-[#FAFCF9]'
                            );
                          }
                        });
                      };

                      document.addEventListener('input', (event) => {
                        const target = event.target;

                        if (
                          target instanceof HTMLInputElement &&
                          target.id === 'cari-siswa'
                        ) {
                          updateSearch();
                        }
                      });

                      document.addEventListener('change', (event) => {
                        const target = event.target;

                        if (
                          target instanceof HTMLInputElement &&
                          target.matches('[data-siswa-checkbox]')
                        ) {
                          updateSelected();
                        }
                      });

                      document.addEventListener('click', (event) => {
                        const target = event.target;

                        if (!(target instanceof Element)) return;

                        const clearButton = target.closest(
                          '#hapus-cari-siswa'
                        );

                        if (!clearButton) return;

                        const input = document.getElementById('cari-siswa');

                        if (
                          input instanceof HTMLInputElement
                        ) {
                          input.value = '';
                          updateSearch();
                          input.focus();
                        }
                      });

                      const init = () => {
                        updateSearch();
                        updateSelected();
                      };

                      if (document.readyState === 'loading') {
                        document.addEventListener(
                          'DOMContentLoaded',
                          init,
                          { once: true }
                        );
                      } else {
                        init();
                      }
                    })();
                  `}
                </Script>
              </>
            )}

            <div className="mt-5 border-t border-[#EEF3EC] pt-5">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738]"
              >
                <Save className="h-4 w-4" />
                Simpan Sesi
              </button>

              <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#063D27]" />
                Setelah disimpan, sesi akan muncul di dashboard tentor, admin, dan orang tua siswa terkait.
              </p>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}
