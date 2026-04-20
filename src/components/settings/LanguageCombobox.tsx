import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { TargetLanguage } from "../../types";
import {
  buildLanguagePickerSections,
  getCustomLanguageOption,
} from "../../lib/languageOptions";

type LanguageComboboxProps = {
  id: string;
  value: TargetLanguage;
  onChange: (language: TargetLanguage) => void;
};

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function LanguageCombobox({
  id,
  value,
  onChange,
}: LanguageComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const sections = useMemo(
    () => buildLanguagePickerSections(query),
    [query]
  );
  const customOption = useMemo(
    () => getCustomLanguageOption(query, value),
    [query, value]
  );
  const flattenedOptions = useMemo(() => {
    const builtIn = sections.flatMap((section) =>
      section.items.map((language) => ({
        key: language.code,
        language,
      }))
    );

    return customOption
      ? [
          ...builtIn,
          {
            key: customOption.code,
            language: customOption,
          },
        ]
      : builtIn;
  }, [customOption, sections]);

  useEffect(() => {
    if (!open) {
      optionRefs.current = [];
      return;
    }

    setQuery("");
    setHighlightedIndex(0);

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    const nextOption = optionRefs.current[highlightedIndex];
    nextOption?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleSelect = (language: TargetLanguage) => {
    onChange(language);
    setOpen(false);
    setQuery("");
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        flattenedOptions.length === 0
          ? 0
          : Math.min(current + 1, flattenedOptions.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        flattenedOptions.length === 0 ? 0 : Math.max(current - 1, 0)
      );
      return;
    }

    if (event.key === "Enter") {
      if (flattenedOptions.length === 0) {
        return;
      }

      event.preventDefault();
      handleSelect(flattenedOptions[highlightedIndex].language);
    }
  };

  let optionIndex = -1;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="language-combobox-trigger"
          type="button"
        >
          <span className="language-combobox-trigger-text">{value.label}</span>
          <ChevronDownIcon />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          className="language-combobox-content"
          sideOffset={8}
        >
          <input
            ref={inputRef}
            aria-label="Search languages"
            className="language-combobox-input"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search languages"
            type="text"
            value={query}
          />

          <div className="language-combobox-list" role="listbox">
            {sections.map((section) => (
              <div key={section.id} className="language-combobox-section">
                {section.title ? (
                  <div className="language-combobox-section-title">{section.title}</div>
                ) : null}

                {section.items.map((language) => {
                  optionIndex += 1;
                  const currentIndex = optionIndex;
                  const isSelected = language.code === value.code;
                  const isHighlighted = currentIndex === highlightedIndex;

                  return (
                    <button
                      key={language.code}
                      ref={(element) => {
                        optionRefs.current[currentIndex] = element;
                      }}
                      className={`language-combobox-option ${
                        isHighlighted ? "is-highlighted" : ""
                      } ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleSelect(language)}
                      onMouseEnter={() => setHighlightedIndex(currentIndex)}
                      role="option"
                      type="button"
                    >
                      <span>{language.label}</span>
                      {isSelected ? <CheckIcon /> : null}
                    </button>
                  );
                })}
              </div>
            ))}

            {customOption ? (
              <button
                ref={(element) => {
                  optionRefs.current[flattenedOptions.length - 1] = element;
                }}
                className={`language-combobox-option language-combobox-option-custom ${
                  highlightedIndex === flattenedOptions.length - 1
                    ? "is-highlighted"
                    : ""
                }`}
                onClick={() => handleSelect(customOption)}
                onMouseEnter={() => setHighlightedIndex(flattenedOptions.length - 1)}
                role="option"
                type="button"
              >
                Use custom language: {customOption.label}
              </button>
            ) : null}

            {flattenedOptions.length === 0 ? (
              <div className="language-combobox-empty">
                No languages found.
              </div>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
