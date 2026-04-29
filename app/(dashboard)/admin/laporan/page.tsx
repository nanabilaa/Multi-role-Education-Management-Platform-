import Header from '@/components/admin/Header'

export default function LaporanPage() {
  return (
    <>
      <Header title="Export Laporan" subtitle="Export data ke Excel" />
      <div className="px-6 pb-6 mt-4">
        <div className="card">
          <p className="text-sm text-gray-500">Fitur export Excel</p>
        </div>
      </div>
    </>
  )
}