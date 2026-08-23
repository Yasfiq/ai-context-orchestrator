export type AsyncAction = "onboarding" | "generation" | "revision";

const GENERIC_MESSAGES: Record<AsyncAction, string> = {
  onboarding: "Jawaban belum dapat diproses. Silakan kirim kembali jawaban terakhir.",
  generation: "Dokumen belum dapat disusun. Coba kembali dari tahap yang terhenti.",
  revision: "Perubahan belum dapat diterapkan. Silakan coba kembali.",
};

export function getAsyncFailureMessage(
  error: unknown,
  action: AsyncAction
): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "Koneksi terputus. Sambungkan kembali perangkat Anda, lalu coba lagi.";
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "Proses melewati batas waktu. Coba kembali; progres yang sudah selesai tetap tersimpan.";
  }

  return GENERIC_MESSAGES[action];
}
