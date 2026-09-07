export const UI_COPY = {
  productName: "AI Context Orchestrator",
  workspaceName: "Ruang Konteks Proyek",
  onboarding: {
    welcome:
      "Mulai dari gambaran kasarnya. Saya akan menguji asumsi, memperjelas keputusan, dan menahan bagian yang belum cukup matang.\n\nProyek apa yang ingin Anda bangun?",
    progress: "Konteks proyek",
    generate: "Susun dokumen",
    inputPlaceholder: "Ceritakan proyek Anda...",
    correctionPlaceholder: "Jelaskan bagian yang perlu dikoreksi...",
  },
  generation: {
    title: "Menyusun dokumen proyek",
    preparing: "Menyiapkan urutan penyusunan dokumen...",
    complete: "Seluruh dokumen siap dibaca.",
    redirecting: "Membuka ruang baca...",
    retry: "Coba tahap ini lagi",
  },
  results: {
    title: "Dokumen proyek",
    guidance: "Pilih dokumen untuk membaca atau merevisi.",
    startOver: "Mulai ulang proyek",
    regenerate: "Susun ulang",
    downloadAll: "Unduh semua dokumen",
    downloadBundle: "Unduh dokumen gabungan",
  },
} as const;

export const MUST_HAVE_UI_LABELS = {
  projectVision: "Visi proyek",
  userRolesPermissions: "Peran dan izin pengguna",
  keyFeatures: "Fitur inti MVP",
  techStackCore: "Fondasi teknologi",
  dataFlowIntegration: "Alur data dan integrasi",
  qaAndTesting: "QA dan pengujian",
  securityCompliance: "Keamanan dan kepatuhan",
  teamPersonas: "Persona tim dan agen AI",
} as const;
