"use client";

import { useAppStore } from "@/store/use-app-store";
import { ZenTerminal } from "./ZenTerminal";
import { GenerationProgress } from "./GenerationProgress";
import { ResultsView } from "./ResultsView";

export function AppShell() {
  const phase = useAppStore((state) => state.phase);

  switch (phase) {
    case "onboarding":
      return <ZenTerminal />;
    case "generating":
      return <GenerationProgress />;
    case "results":
      return <ResultsView />;
    default:
      return <ZenTerminal />;
  }
}
