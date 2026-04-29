// components/admin/siswa/DeleteButton.tsx
'use client'

export default function DeleteButton({
  id,
  nama,
}: {
  id: string
  nama: string
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const yakin = confirm(`Hapus siswa "${nama}"?`)

    if (!yakin) {
      e.preventDefault()
    }
  }

  return (
    <form action="/api/admin/siswa/delete" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        Hapus
      </button>
    </form>
  )
}