import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageCombobox } from "./LanguageCombobox";

describe("LanguageCombobox", () => {
  test("renders the selected language as a closed trigger button", () => {
    const html = renderToStaticMarkup(
      <LanguageCombobox
        id="default-language-select"
        onChange={() => {}}
        value={{ code: "zh-CN", label: "Chinese (Simplified)" }}
      />
    );

    expect(html).toContain('class="language-combobox-trigger"');
    expect(html).toContain("Chinese (Simplified)");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('role="combobox"');
  });
});
