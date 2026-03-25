import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import Button from "./Button";

afterEach(cleanup);

describe("Button", () => {
  it("renders children", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole("button")).toHaveTextContent("Click me");
  });

  it("applies primary variant by default", () => {
    const { getByRole } = render(<Button>Test</Button>);
    expect(getByRole("button").className).toContain("bg-foreground");
  });

  it("applies secondary variant", () => {
    const { getByRole } = render(<Button variant="secondary">Test</Button>);
    expect(getByRole("button").className).toContain("bg-card");
  });

  it("applies ghost variant", () => {
    const { getByRole } = render(<Button variant="ghost">Test</Button>);
    expect(getByRole("button").className).toContain("bg-transparent");
  });

  it("applies size sm", () => {
    const { getByRole } = render(<Button size="sm">Test</Button>);
    expect(getByRole("button").className).toContain("text-sm");
  });

  it("applies disabled state", () => {
    const { getByRole } = render(<Button disabled>Test</Button>);
    expect(getByRole("button")).toBeDisabled();
  });

  it("merges custom className", () => {
    const { getByRole } = render(<Button className="custom-class">Test</Button>);
    expect(getByRole("button").className).toContain("custom-class");
  });
});
