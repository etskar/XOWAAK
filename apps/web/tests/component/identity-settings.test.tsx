import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getIdentityMessages } from "@/i18n/identity-messages";
import { ProfileForm } from "@/features/profile/profile-form";
import { SettingsShell } from "@/features/settings/settings-shell";
import { PrivacyForm } from "@/features/settings/settings-forms";

vi.mock("@/server/identity/actions", () => ({
  cancelAccountDeletion: vi.fn(),
  registerCurrentDevice: vi.fn(),
  requestAccountDeletion: vi.fn(),
  revokeDevice: vi.fn(),
  updatePrivacySettings: vi.fn(),
  updateProfile: vi.fn(),
  updateSettings: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en/settings",
  useSearchParams: () => new URLSearchParams(),
}));

describe("identity and settings components", () => {
  it("renders an accessible profile form in Arabic", () => {
    const messages = getIdentityMessages("ar");

    render(<ProfileForm locale="ar" messages={messages} profile={null} unavailable />);

    expect(screen.getByRole("textbox", { name: messages.profile.username })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: messages.profile.displayName })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.profile.save })).toBeDisabled();
  });

  it("renders privacy controls with labels and a disabled unavailable state", () => {
    const messages = getIdentityMessages("en");

    render(
      <PrivacyForm
        locale="en"
        messages={messages}
        visibility="public"
        discoverability="discoverable"
        contactPrivacy="authenticated"
        unavailable
      />,
    );

    expect(screen.getByRole("button", { name: /Profile visibility/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: messages.privacy.save })).toBeDisabled();
  });

  it("renders settings navigation without product-domain links", () => {
    render(
      <SettingsShell locale="en">
        <h1>Settings content</h1>
      </SettingsShell>,
    );

    expect(screen.getByRole("navigation", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/en/settings/privacy",
    );
    expect(screen.queryByRole("link", { name: /marketplace/i })).not.toBeInTheDocument();
  });
});
