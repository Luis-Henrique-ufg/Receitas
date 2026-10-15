import { describe, it, expect } from "vitest";

describe("Vitest & Testing Library Environment", () => {
  it("renders DOM nodes in jsdom environment", () => {
    const div = document.createElement("div");
    div.textContent = "ISO 12207 Verification";
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
  });
});
