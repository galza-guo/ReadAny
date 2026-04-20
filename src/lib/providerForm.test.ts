import { describe, expect, test } from "bun:test";
import { canListModels } from "./providerForm";

describe("provider form", () => {
  test("only lists models when a provider has enough connection info", () => {
    expect(
      canListModels({ kind: "openai-compatible", baseUrl: "", apiKey: "x" })
    ).toBe(false);
    expect(canListModels({ kind: "deepseek", apiKey: "x" })).toBe(true);
  });
});
