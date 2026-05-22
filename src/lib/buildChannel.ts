export type ReadaniBuildChannel = "github" | "appstore";

declare const __READANI_BUILD_CHANNEL__: ReadaniBuildChannel | undefined;

function normalizeBuildChannel(value: unknown): ReadaniBuildChannel {
  return value === "appstore" ? "appstore" : "github";
}

export const READANI_BUILD_CHANNEL = normalizeBuildChannel(
  typeof __READANI_BUILD_CHANNEL__ === "undefined"
    ? undefined
    : __READANI_BUILD_CHANNEL__
);

export const READANI_IS_APP_STORE_BUILD = READANI_BUILD_CHANNEL === "appstore";
export const READANI_IS_GITHUB_BUILD = READANI_BUILD_CHANNEL === "github";

export const READANI_MANAGED_GATEWAY_ENABLED = READANI_IS_APP_STORE_BUILD;
export const READANI_SUBSCRIPTIONS_ENABLED = READANI_IS_APP_STORE_BUILD;
export const READANI_APP_UPDATES_ENABLED = READANI_IS_GITHUB_BUILD;
