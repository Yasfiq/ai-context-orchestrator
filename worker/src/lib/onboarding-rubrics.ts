import type { MustHaveKey } from "@/types/schema";

export const MATURITY_RUBRICS: Record<MustHaveKey, string[]> = {
  projectVision: [
    "target user or usage context",
    "primary problem",
    "desired outcome",
    "product workflow or shape",
  ],
  userRolesPermissions: [
    "primary actors",
    "what each actor can do",
    "meaningful access boundaries",
  ],
  keyFeatures: [
    "three to five MVP capabilities",
    "the highest-priority capability",
    "connection to the confirmed user problem",
  ],
  techStackCore: [
    "target platform and constraints",
    "one coherent recommended preset",
    "explicit user confirmation",
  ],
  dataFlowIntegration: [
    "data sources",
    "storage destination",
    "external integrations or explicit absence",
  ],
  qaAndTesting: [
    "critical user flows",
    "appropriate test levels",
    "minimum release confidence",
  ],
  securityCompliance: [
    "data sensitivity",
    "authentication requirement",
    "privacy or compliance constraints",
  ],
  teamPersonas: [
    "work domains that need ownership",
    "agent responsibility boundaries",
    "expected collaboration or handoff",
  ],
};
