"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateManagedUser } from "@/app/(dashboard)/superadmin/users/actions";

type EditableUser = {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: string;
};

type EditUserDialogProps = {
  user: EditableUser;
};

export default function EditUserDialog({
  user,
}: EditUserDialogProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [errorMessage, setErrorMessage] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone ?? "");
      setErrorMessage("");
    }
  }, [isOpen, user.full_name, user.phone]);

  function closeDialog() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const cleanName = fullName.trim();

    if (cleanName.length < 2) {
      setErrorMessage("Nama pengguna minimal terdiri dari 2 karakter.");
      return;
    }

    startTransition(async () => {
      const result = await updateManagedUser({
        userId: user.id,
        fullName: cleanName,
        phone: phone.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                  Edit pengguna
                </p>

                <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                  Perbarui profil
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {user.email ?? "Email tidak tersedia"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label
                    htmlFor={`full-name-${user.id}`}
                    className="mb-2 block text-sm font-medium text-neutral-800"
                  >
                    Nama lengkap
                  </label>

                  <input
                    id={`full-name-${user.id}`}
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setErrorMessage("");
                    }}
                    autoComplete="name"
                    maxLength={100}
                    disabled={isPending}
                    className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`phone-${user.id}`}
                    className="mb-2 block text-sm font-medium text-neutral-800"
                  >
                    Nomor telepon
                  </label>

                  <input
                    id={`phone-${user.id}`}
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setErrorMessage("");
                    }}
                    autoComplete="tel"
                    maxLength={30}
                    disabled={isPending}
                    className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-neutral-500">
                      Role pengguna
                    </span>

                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold capitalize text-neutral-700">
                      {user.role}
                    </span>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50/70 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isPending}
                  className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isPending || fullName.trim().length < 2}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan
                    </>
                  ) : (
                    "Simpan perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}