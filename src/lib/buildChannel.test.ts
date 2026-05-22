import { describe, expect, test } from "bun:test";
import buildChannelSource from "./buildChannel.ts?raw";
import viteConfigSource from "../../vite.config.ts?raw";

describe("build channel", () => {
  test("defaults to the GitHub BYOK lane", () => {
    expect(viteConfigSource).toContain('process.env.READANI_BUILD_CHANNEL ?? "github"');
    expect(buildChannelSource).toContain('export const READANI_BUILD_CHANNEL =');
  });

  test("derives managed gateway availability from the App Store lane", () => {
    expect(buildChannelSource).toContain('READANI_BUILD_CHANNEL === "appstore"');
    expect(buildChannelSource).toContain("READANI_MANAGED_GATEWAY_ENABLED");
  });
});
