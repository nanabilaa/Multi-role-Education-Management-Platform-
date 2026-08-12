"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type UpdateManagedUserInput = {
  userId: string;
  fullName: string;
  phone: string;
};

type UpdateManagedUserResult = {
  success: boolean;
  message: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateManagedUser(
  input: UpdateManagedUserInput,
): Promise<UpdateManagedUserResult> {
  try {
    const userId = input.userId?.trim();
    const fullName = input.fullName?.trim();
    const phone = input.phone?.trim() || null;

    if (!userId || !UUID_PATTERN.test(userId)) {
      return {
        success: false,
        message: "ID pengguna tidak valid.",
      };
    }

    if (!fullName || fullName.length < 2) {
      return {
        success: false,
        message: "Nama pengguna minimal terdiri dari 2 karakter.",
      };
    }

    if (fullName.length > 100) {
      return {
        success: false,
        message: "Nama pengguna maksimal terdiri dari 100 karakter.",
      };
    }

    if (phone && phone.length > 30) {
      return {
        success: false,
        message: "Nomor telepon maksimal terdiri dari 30 karakter.",
      };
    }

    /*
     * Memeriksa pengguna yang sedang login.
     * Client ini menggunakan cookie session pengguna.
     */
    const supabase = await createClient();

    const {
      data: { user: currentUser },
      error: currentUserError,
    } = await supabase.auth.getUser();

    if (currentUserError || !currentUser) {
      return {
        success: false,
        message: "Sesi login tidak ditemukan. Silakan login kembali.",
      };
    }

    /*
     * Memastikan action hanya dapat dijalankan oleh superadmin.
     */
    const { data: currentProfile, error: currentProfileError } =
      await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (currentProfileError) {
      return {
        success: false,
        message: `Gagal memeriksa role: ${currentProfileError.message}`,
      };
    }

    if (!currentProfile || currentProfile.role !== "superadmin") {
      return {
        success: false,
        message: "Hanya superadmin yang dapat mengedit pengguna.",
      };
    }

    /*
     * Admin client hanya dibuat setelah role berhasil diverifikasi.
     */
    const supabaseAdmin = createAdminClient();

    const { data: oldProfile, error: oldProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, phone, role")
        .eq("id", userId)
        .maybeSingle();

    if (oldProfileError) {
      return {
        success: false,
        message: `Gagal membaca profil pengguna: ${oldProfileError.message}`,
      };
    }

    if (!oldProfile) {
      return {
        success: false,
        message: "Profil pengguna tidak ditemukan.",
      };
    }

    /*
     * Membaca metadata Auth lama agar metadata seperti role atau
     * properti lain tidak terhapus saat nama diperbarui.
     */
    const { data: authUserData, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authUserError || !authUserData.user) {
      return {
        success: false,
        message:
          authUserError?.message ??
          "Akun Supabase Auth pengguna tidak ditemukan.",
      };
    }

    const oldMetadata = authUserData.user.user_metadata ?? {};

    /*
     * Update nama pada Supabase Authentication.
     */
    const { error: updateAuthError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...oldMetadata,
          full_name: fullName,
          name: fullName,
          display_name: fullName,
        },
      });

    if (updateAuthError) {
      return {
        success: false,
        message: `Gagal memperbarui Auth: ${updateAuthError.message}`,
      };
    }

    /*
     * Update profil yang digunakan aplikasi CBS.
     */
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateProfileError) {
      /*
       * Rollback metadata Auth apabila update profile gagal.
       */
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: oldMetadata,
      });

      return {
        success: false,
        message: `Gagal memperbarui profil: ${updateProfileError.message}`,
      };
    }

    revalidatePath("/superadmin");
    revalidatePath("/superadmin/users");
    revalidatePath("/superadmin/admin");

    return {
      success: true,
      message: `${oldProfile.email ?? "Pengguna"} berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("updateManagedUser error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan ketika memperbarui pengguna.",
    };
  }
}