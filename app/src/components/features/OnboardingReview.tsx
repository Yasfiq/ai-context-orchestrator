"use client";

import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/use-app-store";
import { MUST_HAVE_KEYS } from "@/types/schema";
import { ArrowRight, PencilLine } from "lucide-react";
import { MUST_HAVE_UI_LABELS } from "@/lib/ui-copy";

interface OnboardingReviewProps {
  onConfirmed: () => void;
}

export function OnboardingReview({ onConfirmed }: OnboardingReviewProps) {
  const {
    mustHaves,
    sessionLanguage,
    reopenVariable,
    confirmOnboarding,
  } = useAppStore();
  const isId = sessionLanguage === "id";

  const handleConfirm = () => {
    if (confirmOnboarding()) onConfirmed();
  };

  return (
    <section className="mx-auto mb-5 w-full max-w-4xl border-y border-success/40 bg-success/[0.035] px-1 py-5">
      <div className="mb-5 flex items-start justify-between gap-4 px-3">
        <div>
          <p className="eyebrow text-success">Siap dikonfirmasi</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
          {isId ? "Tinjau konteks sebelum menyusun dokumen" : "Review context before generation"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {isId
              ? "Pastikan delapan keputusan ini mencerminkan proyek Anda. Buka salah satu bagian jika masih perlu dikoreksi."
              : "Make sure these eight decisions accurately represent your project."}
          </p>
        </div>
        <span className="font-mono text-xs text-success">8 / 8</span>
      </div>

      <div className="grid border-t border-border sm:grid-cols-2">
        {MUST_HAVE_KEYS.map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => reopenVariable(key)}
            className="group grid min-h-28 grid-cols-[2rem_1fr_auto] gap-3 border-b border-border p-3 text-left transition-colors hover:bg-surface sm:odd:border-r"
          >
            <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-success">
                {MUST_HAVE_UI_LABELS[key]}
              </span>
              <span className="mt-2 block line-clamp-3 text-sm leading-relaxed text-foreground/85">
                {mustHaves[key]}
              </span>
            </span>
            <PencilLine className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="flex justify-end px-3 pt-5">
        <Button
          type="button"
          variant="success"
          onClick={handleConfirm}
        >
          {isId ? "Konfirmasi konteks" : "Confirm context"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
