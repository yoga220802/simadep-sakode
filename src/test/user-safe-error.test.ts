import { describe, expect, it } from "vitest";
import { z } from "zod";

import { getUserSafeErrorMessage } from "@/src/shared/errors";

describe("user safe error mapping", () => {
  it("does not expose Drizzle SQL query text", () => {
    const message = getUserSafeErrorMessage(
      new Error(
        "Failed query: insert into `user` (`id`, `email`) values (?, ?) params: 1,test@example.com",
      ),
      "Gagal memproses aksi.",
    );

    expect(message).toBe("Gagal memproses aksi.");
    expect(message).not.toContain("insert into");
    expect(message).not.toContain("params");
  });

  it("does not expose SQL query text from nested error causes", () => {
    const message = getUserSafeErrorMessage(
      new Error("Mutation failed.", {
        cause: new Error(
          "Failed query: insert into `audit_logs` (`id`, `task_id`) values (?, ?) params: 1,task-1",
        ),
      }),
      "Gagal memproses aksi.",
    );

    expect(message).toBe("Gagal memproses aksi.");
    expect(message).not.toContain("audit_logs");
    expect(message).not.toContain("params");
  });

  it("maps database constraint errors to user-facing messages", () => {
    expect(
      getUserSafeErrorMessage(
        new Error("ER_DUP_ENTRY: Duplicate entry 'demo' for key 'user.email'"),
        "Gagal memproses aksi.",
      ),
    ).toBe("Data sudah ada. Periksa kembali input yang harus unik.");

    expect(
      getUserSafeErrorMessage(
        new Error("Cannot add or update a child row: a foreign key constraint fails"),
        "Gagal memproses aksi.",
      ),
    ).toBe(
      "Data terkait tidak ditemukan atau sudah berubah. Muat ulang halaman lalu coba lagi.",
    );
  });

  it("keeps intentional business messages readable", () => {
    expect(
      getUserSafeErrorMessage(
        new Error("User harus menjadi anggota aktif departemen project."),
        "Gagal memproses aksi.",
      ),
    ).toBe("User harus menjadi anggota aktif departemen project.");
  });

  it("maps validation errors without leaking parser details", () => {
    const schema = z.object({ name: z.string().min(2) });
    const result = schema.safeParse({ name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getUserSafeErrorMessage(result.error, "Gagal validasi.")).toBe(
        "Data tidak valid. Periksa kembali input yang diisi.",
      );
    }
  });
});
