import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoutePlaceholder } from "@/components/route-placeholder";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

describe("RoutePlaceholder", () => {
  it("renders an accessible route heading", () => {
    render(<RoutePlaceholder title="Foundation" description="Shell only" />);

    expect(screen.getByRole("heading", { name: "Foundation" })).toBeInTheDocument();
    expect(screen.getByText("Shell only")).toBeInTheDocument();
  });
});
