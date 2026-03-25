import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import Badge from "./Badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders the label", () => {
    const { getByText } = render(<Badge sentiment="positive" label="Good" />);
    expect(getByText("Good")).toBeInTheDocument();
  });

  it("applies positive sentiment classes", () => {
    const { container } = render(
      <Badge sentiment="positive" label="Positive" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-sentiment-positive");
    expect(badge.className).toContain("bg-sentiment-positive-bg");
  });

  it("applies negative sentiment classes", () => {
    const { container } = render(
      <Badge sentiment="negative" label="Negative" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-sentiment-negative");
  });

  it("applies neutral sentiment classes", () => {
    const { container } = render(
      <Badge sentiment="neutral" label="Neutral" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-sentiment-neutral");
  });

  it("includes the dot indicator", () => {
    const { container } = render(
      <Badge sentiment="positive" label="Test" />
    );
    const dot = container.querySelector(".rounded-full.w-2");
    expect(dot).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(
      <Badge sentiment="positive" label="Test" className="extra" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("extra");
  });
});
