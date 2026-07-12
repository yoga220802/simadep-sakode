"use client";

import Image from "next/image";
import { useActionState, useEffect } from "react";

import { useActionToast } from "@/src/shared/ui/use-action-toast";
import type { UserActionResult } from "../server/action-state";
import {
  updateOwnPasswordAction,
  updateOwnProfileAction,
} from "../server/user-actions";

type ProfileRecord = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  employeeNumber: string | null;
  displayName: string | null;
  position: string | null;
  workUnit: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

type ProfileViewProps = {
  profile: ProfileRecord;
};

const initialState: UserActionResult = { ok: true, message: "" };

function ActionMessage({ state }: { state: UserActionResult }) {
  if (!state.message) return null;

  return (
    <p
      className={
        state.ok
          ? "text-sm text-[var(--color-accent)]"
          : "text-sm text-[var(--color-secondary)]"
      }
    >
      {state.message}
    </p>
  );
}

export function ProfileView({ profile }: ProfileViewProps) {
  const [profileState, profileAction, isSavingProfile] = useActionState(
    updateOwnProfileAction,
    initialState,
  );
  const [passwordState, passwordAction, isSavingPassword] = useActionState(
    updateOwnPasswordAction,
    initialState,
  );
  useActionToast(profileState, {
    isPending: isSavingProfile,
    loadingMessage: "Menyimpan profil dan mengunggah foto jika ada...",
  });
  useActionToast(passwordState, {
    isPending: isSavingPassword,
    loadingMessage: "Memperbarui password...",
  });
  useEffect(() => {
    if (!passwordState.ok || !passwordState.redirectTo) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.assign(passwordState.redirectTo ?? "/login");
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [passwordState]);
  const avatarUrl = profile.avatarUrl ?? profile.image;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
          Profil Saya
        </h1>
        <p className="text-sm text-gray-500">
          Kelola identitas akun, foto profil, dan password SIMADEP Anda.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <form action={profileAction} className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="space-y-3">
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-[var(--simadep-primary-soft)]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.displayName ?? profile.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[var(--color-primary)]">
                  {(profile.displayName ?? profile.name).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <input
              aria-label="Upload foto profil"
              name="avatar"
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-gray-700">
              Email
              <input
                value={profile.email}
                disabled
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-gray-700">
              Nama akun
              <input
                name="name"
                defaultValue={profile.name}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-gray-700">
              Nama tampilan
              <input
                name="displayName"
                defaultValue={profile.displayName ?? profile.name}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-gray-700">
              NIP/Nomor pegawai
              <input
                name="employeeNumber"
                defaultValue={profile.employeeNumber ?? ""}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-gray-700">
              Jabatan
              <input
                name="position"
                defaultValue={profile.position ?? ""}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-gray-700">
              Unit kerja
              <input
                name="workUnit"
                defaultValue={profile.workUnit ?? ""}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-gray-700 md:col-span-2">
              Telepon
              <input
                name="phone"
                defaultValue={profile.phone ?? ""}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <div className="space-y-3 md:col-span-2">
              <ActionMessage state={profileState} />
              <button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--simadep-foreground)] disabled:opacity-60"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text-main)]">
          Ubah Password
        </h2>
        <form action={passwordAction} className="grid gap-3 md:max-w-xl">
          <input
            aria-label="Password saat ini"
            name="currentPassword"
            type="password"
            placeholder="Password saat ini"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            required
          />
          <input
            aria-label="Password baru"
            name="newPassword"
            type="password"
            placeholder="Password baru"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            required
          />
          <ActionMessage state={passwordState} />
          <button
            type="submit"
            disabled={isSavingPassword}
            className="w-fit rounded-lg bg-[var(--color-secondary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Ubah Password
          </button>
        </form>
      </section>
    </div>
  );
}
