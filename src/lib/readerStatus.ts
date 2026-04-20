export type ReaderStatusKind =
  | "ready"
  | "loading-document"
  | "extracting-text"
  | "translating-page"
  | "redoing-page"
  | "translation-failed";

export type ReaderStatusOptions = {
  page?: number;
};

export function getReaderStatusLabel(
  kind: ReaderStatusKind,
  options: ReaderStatusOptions = {}
): string {
  if (kind === "loading-document") {
    return "Loading document";
  }

  if (kind === "extracting-text") {
    return "Extracting text";
  }

  if (kind === "translating-page") {
    return options.page ? `Translating page ${options.page}` : "Translating page";
  }

  if (kind === "redoing-page") {
    return options.page ? `Redoing page ${options.page}` : "Redoing page";
  }

  if (kind === "translation-failed") {
    return "Translation failed";
  }

  return "Ready";
}
