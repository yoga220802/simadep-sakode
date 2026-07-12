import { ZodError } from "zod";

const technicalErrorPatterns = [
  /failed query/i,
  /\bparams:/i,
  /\bsql\b/i,
  /drizzlequeryerror/i,
  /mysql/i,
  /er_[a-z0-9_]+/i,
  /duplicate entry/i,
  /foreign key constraint/i,
  /cannot add or update a child row/i,
  /data too long/i,
  /incorrect .* value/i,
  /truncated/i,
  /connection/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /enoent/i,
  /eperm/i,
  /eacces/i,
  /cloudinary/i,
  /credentials are incomplete/i,
];

export function getUserSafeErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof ZodError) {
    return "Data tidak valid. Periksa kembali input yang diisi.";
  }

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = collectErrorMessages(error).join("\n").trim();
  if (!message) {
    return fallbackMessage;
  }

  if (isTechnicalError(message)) {
    return mapTechnicalError(message, fallbackMessage);
  }

  return message;
}

function collectErrorMessages(error: Error) {
  const messages: string[] = [];
  let current: unknown = error;

  while (current instanceof Error) {
    if (current.message) {
      messages.push(current.message);
    }
    current = current.cause;
  }

  return messages.length ? messages : [error.message];
}

export function isTechnicalError(message: string) {
  return technicalErrorPatterns.some((pattern) => pattern.test(message));
}

function mapTechnicalError(message: string, fallbackMessage: string) {
  if (/duplicate entry/i.test(message) || /er_dup_entry/i.test(message)) {
    return "Data sudah ada. Periksa kembali input yang harus unik.";
  }

  if (
    /foreign key constraint/i.test(message) ||
    /cannot add or update a child row/i.test(message) ||
    /er_no_referenced_row/i.test(message)
  ) {
    return "Data terkait tidak ditemukan atau sudah berubah. Muat ulang halaman lalu coba lagi.";
  }

  if (/data too long/i.test(message)) {
    return "Input terlalu panjang. Periksa kembali data yang diisi.";
  }

  if (/connection|econnrefused|etimedout|enotfound/i.test(message)) {
    return "Koneksi layanan sedang bermasalah. Coba lagi beberapa saat.";
  }

  if (/enoent|eperm|eacces|cloudinary|credentials are incomplete/i.test(message)) {
    return "Upload file gagal diproses. Coba lagi atau gunakan file lain.";
  }

  return fallbackMessage;
}
