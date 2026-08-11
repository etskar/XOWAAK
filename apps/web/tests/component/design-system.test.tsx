import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  Button,
  Checkbox,
  Dialog,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/design-system";

describe("design system primitives", () => {
  it("renders button variants and exposes a pending state", () => {
    render(
      <Button variant="secondary" loading>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveClass("ds-button--secondary");
    expect(button).toHaveAttribute("data-pending");
    expect(button).toBeDisabled();
  });

  it("connects input labels, descriptions, and errors", () => {
    render(
      <Input label="Email" description="Use a work email." error="Email is required." isRequired />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toHaveAccessibleDescription("Use a work email. Email is required.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
  });

  it("opens, focuses, and closes a dialog with the keyboard", async () => {
    const user = userEvent.setup();

    render(
      <Dialog trigger={<Button>Open details</Button>} title="Details">
        Dialog content
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open details" }));

    const dialog = await screen.findByRole("dialog", { name: "Details" });
    expect(dialog).toBeVisible();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Details" })).not.toBeInTheDocument();
    });
  });

  it("supports tab selection and keyboard navigation", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultSelectedKey="first">
        <TabList aria-label="Sections">
          <Tab id="first">First</Tab>
          <Tab id="second">Second</Tab>
        </TabList>
        <TabPanel id="first">First panel</TabPanel>
        <TabPanel id="second">Second panel</TabPanel>
      </Tabs>,
    );

    const firstTab = screen.getByRole("tab", { name: "First" });
    const secondTab = screen.getByRole("tab", { name: "Second" });

    expect(firstTab).toHaveAttribute("aria-selected", "true");

    await user.click(firstTab);
    await user.keyboard("{ArrowRight}");

    expect(secondTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Second panel")).toBeVisible();
  });

  it("keeps form controls usable in an RTL subtree", () => {
    render(
      <div dir="rtl">
        <Stack gap={2}>
          <Input label="البريد الإلكتروني" />
          <Checkbox label="تذكرني" />
          <RadioGroup label="اللغة">
            <Radio value="ar" label="العربية" />
          </RadioGroup>
          <Switch label="تفعيل التنبيهات" />
        </Stack>
      </div>,
    );

    expect(screen.getByRole("textbox", { name: "البريد الإلكتروني" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "تذكرني" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "العربية" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "تفعيل التنبيهات" })).toBeInTheDocument();
  });
});
