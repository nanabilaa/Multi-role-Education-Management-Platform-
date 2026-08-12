import Link from 'next/link'

export default function RetroWindow({
  title,
  address,
  children,
}: {
  title: string
  address: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-[1180px] border-4 border-[#061B12] bg-[#C0C0C0] p-1 shadow-[12px_12px_0_rgba(6,27,18,0.55)]">
      <div className="flex items-center justify-between border-2 border-[#061B12] bg-[#000080] px-3 py-1 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center border border-white bg-[#FF3CC7] text-[9px] font-black">
            C
          </div>
          <p className="font-mono text-sm font-black">{title}</p>
        </div>

        <div className="flex items-center gap-1">
          <span className="flex h-5 w-5 items-center justify-center border border-white bg-[#C0C0C0] text-xs font-black text-[#061B12]">
            _
          </span>
          <span className="flex h-5 w-5 items-center justify-center border border-white bg-[#C0C0C0] text-xs font-black text-[#061B12]">
            □
          </span>
          <span className="flex h-5 w-5 items-center justify-center border border-white bg-[#C0C0C0] text-xs font-black text-[#061B12]">
            ×
          </span>
        </div>
      </div>

      <div className="border-x-2 border-b-2 border-[#061B12] bg-[#C0C0C0]">
        <div className="flex gap-5 border-b-2 border-[#808080] px-3 py-2 font-mono text-xs font-bold text-[#061B12]">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Favorites</span>
          <span>Tools</span>
          <span>Help</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#808080] px-3 py-2">
          {['←', '→', '⌂', '⟳', '✕', '★'].map((item) => (
            <span
              key={item}
              className="flex h-7 w-7 items-center justify-center border-2 border-[#061B12] bg-[#EDEDED] text-xs font-black text-[#061B12]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 border-b-2 border-[#808080] px-3 py-2 font-mono text-xs">
          <span className="font-black text-[#061B12]">Address:</span>
          <div className="min-w-0 flex-1 border-2 border-[#061B12] bg-white px-2 py-1 font-bold text-[#063D27]">
            {address}
          </div>
          <Link
            href="/superadmin"
            className="border-2 border-[#061B12] bg-[#00CC99] px-3 py-1 font-black text-[#061B12]"
          >
            Go
          </Link>
        </div>

        <div className="bg-white">{children}</div>
      </div>
    </div>
  )
}