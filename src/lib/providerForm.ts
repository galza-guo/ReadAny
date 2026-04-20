type ProviderFormLike = {
  kind: "openrouter" | "deepseek" | "openai-compatible";
  baseUrl?: string;
  apiKey?: string;
  apiKeyConfigured?: boolean;
};

export function canListModels(provider: ProviderFormLike) {
  if (provider.kind === "openrouter" || provider.kind === "deepseek") {
    return Boolean(provider.apiKey?.trim() || provider.apiKeyConfigured);
  }

  return Boolean(
    provider.baseUrl?.trim() && (provider.apiKey?.trim() || provider.apiKeyConfigured)
  );
}
