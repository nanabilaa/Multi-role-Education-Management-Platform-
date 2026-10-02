import { HardDrive } from 'lucide-react'
import CleanupClient from './CleanupClient'

export default function SuperadminCleanupPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-[#ECEFF1] bg-white p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF1F0] text-[#EA4335]">
              <HardDrive className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#202124]">
                Cleanup Data & Storage
              </h1>
              <p className="mt-1 text-sm font-medium text-[#5F6368]">
                Hapus data lama atau file media besar untuk mengurangi kapasitas penyimpanan server.
              </p>
            </div>
          </div>
        </section>

        <CleanupClient />
      </div>
    </main>
  )
}
