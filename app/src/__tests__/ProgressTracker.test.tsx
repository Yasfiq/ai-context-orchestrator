import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressTracker } from "@/components/features/ProgressTracker";
import { useAppStore } from "@/store/use-app-store";

describe("ProgressTracker", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
  });

  it("should render all 8 Must-Have labels", () => {
    render(<ProgressTracker />);
    expect(screen.getByText("Visi proyek")).toBeTruthy();
    expect(screen.getByText("Peran dan izin pengguna")).toBeTruthy();
    expect(screen.getByText("Fitur inti MVP")).toBeTruthy();
    expect(screen.getByText("Fondasi teknologi")).toBeTruthy();
    expect(screen.getByText("Alur data dan integrasi")).toBeTruthy();
    expect(screen.getByText("QA dan pengujian")).toBeTruthy();
    expect(screen.getByText("Keamanan dan kepatuhan")).toBeTruthy();
    expect(screen.getByText("Persona tim dan agen AI")).toBeTruthy();
  });

  it("should show 0/8 when no variables are filled", () => {
    render(<ProgressTracker />);
    expect(screen.getByText("0/8")).toBeTruthy();
  });

  it("should label empty variables explicitly", () => {
    render(<ProgressTracker />);
    const emptyIndicators = screen.getAllByText("Belum");
    expect(emptyIndicators.length).toBe(8);
  });

  it("should update count when a variable is filled", () => {
    useAppStore.getState().updateMustHave("projectVision", "Build a todo app");
    render(<ProgressTracker />);
    expect(screen.getByText("1/8")).toBeTruthy();
  });

  it("should label confirmed and empty variables explicitly", () => {
    useAppStore.getState().updateMustHave("projectVision", "Build a todo app");
    useAppStore.getState().updateMustHave("keyFeatures", "CRUD, Search, Filter");
    render(<ProgressTracker />);
    const filledIndicators = screen.getAllByText("Terkonfirmasi");
    expect(filledIndicators.length).toBe(2);
    const emptyIndicators = screen.getAllByText("Belum");
    expect(emptyIndicators.length).toBe(6);
  });

  it("should show 8/8 when all variables are filled", () => {
    const store = useAppStore.getState();
    store.updateMustHave("projectVision", "Todo app");
    store.updateMustHave("userRolesPermissions", "Admin, User");
    store.updateMustHave("keyFeatures", "CRUD, Auth");
    store.updateMustHave("techStackCore", "Next.js");
    store.updateMustHave("dataFlowIntegration", "REST API");
    store.updateMustHave("qaAndTesting", "Vitest");
    store.updateMustHave("securityCompliance", "JWT");
    store.updateMustHave("teamPersonas", "Frontend Dev");
    render(<ProgressTracker />);
    expect(screen.getByText("8/8")).toBeTruthy();
  });

  it("should render the localized progress label", () => {
    render(<ProgressTracker />);
    expect(screen.getByText("Konteks proyek")).toBeTruthy();
  });
});
