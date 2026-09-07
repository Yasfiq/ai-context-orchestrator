"use client";

import * as React from "react";
import { useAppStore } from "@/store/use-app-store";
import { ZenTerminal } from "./ZenTerminal";
import { GenerationProgress } from "./GenerationProgress";
import { ResultsView } from "./ResultsView";

export function AppShell() {
  const phase = useAppStore((state) => state.phase);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __appStore?: typeof useAppStore }).__appStore = useAppStore;
    }
  }, []);

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
