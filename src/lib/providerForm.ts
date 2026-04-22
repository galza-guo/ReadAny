type ProviderFormLike = {
  kind: "openrouter" | "deepseek" | "ollama" | "openai-compatible";
  baseUrl?: string;
  apiKey?: string;
  apiKeyConfigured?: boolean;
};

export function canListModels(provider: ProviderFormLike) {
  if (provider.kind === "openrouter" || provider.kind === "deepseek") {
    return Boolean(provider.apiKey?.trim() || provider.apiKeyConfigured);
  }

  if (provider.kind === "ollama") {
    return Boolean(provider.baseUrl?.trim());
  }

  return Boolean(
    provider.baseUrl?.trim() && (provider.apiKey?.trim() || provider.apiKeyConfigured)
  );
}
