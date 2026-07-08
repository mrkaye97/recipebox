import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { components } from "./lib/api/v1";

type Meal = components["schemas"]["Meal"];
type RecipeType = components["schemas"]["RecipeType"];
type FilterKey = "meal" | "cuisine" | "type";

interface FilterToken {
  key: FilterKey;
  value: string;
}

type DropdownItem =
  | { kind: "key"; key: FilterKey }
  | { kind: "value"; key: FilterKey; value: string };

const MEAL_VALUES: Meal[] = ["breakfast", "lunch", "dinner", "other"];
const TYPE_VALUES: RecipeType[] = [
  "starter",
  "main",
  "salad",
  "dessert",
  "snack",
  "cocktail",
  "condiment",
  "other",
];

const FILTER_KEYS: FilterKey[] = ["meal", "cuisine", "type"];

const TOKEN_STYLES: Record<FilterKey, string> = {
  meal: "bg-amber-50 border-amber-200 text-amber-900",
  cuisine: "bg-sky-50 border-sky-200 text-sky-900",
  type: "bg-violet-50 border-violet-200 text-violet-900",
};

const TOKEN_DOT_STYLES: Record<FilterKey, string> = {
  meal: "bg-amber-400",
  cuisine: "bg-sky-400",
  type: "bg-violet-400",
};

function getValuesForKey(key: FilterKey, cuisines: readonly string[]): string[] {
  if (key === "meal") return MEAL_VALUES as string[];
  if (key === "type") return TYPE_VALUES as string[];
  return cuisines as string[];
}

interface SearchBarProps {
  onChange: (value: string) => void;
  cuisines?: readonly string[];
}

export function SearchBar({ onChange, cuisines = [] }: SearchBarProps) {
  const [tokens, setTokens] = useState<FilterToken[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { prefixText, activeWord } = useMemo(() => {
    const lastSpace = rawInput.lastIndexOf(" ");
    if (lastSpace === -1) return { prefixText: "", activeWord: rawInput };
    return {
      prefixText: rawInput.slice(0, lastSpace + 1),
      activeWord: rawInput.slice(lastSpace + 1),
    };
  }, [rawInput]);

  const dropdownItems = useMemo((): DropdownItem[] => {
    if (dismissed || !isFocused) return [];
    const word = activeWord.toLowerCase();

    const colonIdx = word.indexOf(":");
    if (colonIdx !== -1) {
      const keyPart = word.slice(0, colonIdx);
      const valuePart = word.slice(colonIdx + 1);
      const matchedKey = FILTER_KEYS.find((k) => k === keyPart);
      if (matchedKey) {
        const values = getValuesForKey(matchedKey, cuisines);
        return values
          .filter((v) => !valuePart || v.toLowerCase().startsWith(valuePart))
          .map((v) => ({ kind: "value" as const, key: matchedKey, value: v }));
      }
      return [];
    }

    const matchedKeys =
      word.length > 0
        ? FILTER_KEYS.filter((k) => k.startsWith(word))
        : FILTER_KEYS;

    return matchedKeys.map((k) => ({ kind: "key" as const, key: k }));
  }, [activeWord, cuisines, dismissed, isFocused]);

  const isOpen = dropdownItems.length > 0;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [activeWord]);

  // Emit combined search string whenever tokens or rawInput changes
  useEffect(() => {
    const freeText = rawInput.replace(/[^\s:]+:[^\s]+/g, "").trim();
    const parts = [
      ...tokens.map((t) => `${t.key}:${t.value}`),
      ...(freeText ? [freeText] : []),
    ];
    onChange(parts.join(" "));
  }, [tokens, rawInput, onChange]);

  const selectItem = useCallback(
    (item: DropdownItem) => {
      setDismissed(false);
      if (item.kind === "key") {
        setRawInput(prefixText + item.key + ":");
      } else {
        setTokens((prev) => [
          ...prev.filter((t) => t.key !== item.key),
          { key: item.key, value: item.value },
        ]);
        setRawInput(prefixText.trimEnd());
      }
      setHighlightIndex(-1);
      inputRef.current?.focus();
    },
    [prefixText],
  );

  const removeToken = useCallback((key: FilterKey) => {
    setTokens((prev) => prev.filter((t) => t.key !== key));
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown" && isOpen) {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, dropdownItems.length - 1));
      } else if (e.key === "ArrowUp" && isOpen) {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (
        (e.key === "Enter" || e.key === "Tab") &&
        isOpen &&
        highlightIndex >= 0
      ) {
        e.preventDefault();
        selectItem(dropdownItems[highlightIndex]);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setDismissed(true);
        setHighlightIndex(-1);
      } else if (e.key === "Backspace" && rawInput === "" && tokens.length > 0) {
        setTokens((prev) => prev.slice(0, -1));
      }
    },
    [isOpen, dropdownItems, highlightIndex, selectItem, rawInput, tokens.length],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRawInput(e.target.value);
      setDismissed(false);
    },
    [],
  );

  return (
    <div className="relative w-full sm:max-w-md">
      <div
        className="flex min-h-[48px] flex-wrap items-center gap-1.5 rounded-lg border-2 border-ink/40 bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-cardboard cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tokens.map((token) => (
          <span
            key={token.key}
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-sm font-medium ${TOKEN_STYLES[token.key]}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${TOKEN_DOT_STYLES[token.key]}`}
            />
            <span className="opacity-60 font-normal text-xs">{token.key}:</span>
            <span>{token.value}</span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                removeToken(token.key);
              }}
              className="ml-0.5 leading-none opacity-40 hover:opacity-90 transition-opacity"
              aria-label={`Remove ${token.key} filter`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={rawInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={tokens.length === 0 ? "Search recipes" : "Add filter or search…"}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-ink placeholder:text-ink-light/50 focus:outline-none"
        />
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border-2 border-ink/20 bg-card shadow-lg"
        >
          {dropdownItems.map((item, i) => {
            const itemKey =
              item.kind === "key" ? item.key : `${item.key}:${item.value}`;
            return (
              <li key={itemKey} role="option" aria-selected={i === highlightIndex}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectItem(item);
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    i === highlightIndex ? "bg-cardboard/15" : "hover:bg-cream"
                  }`}
                >
                  {item.kind === "key" ? (
                    <>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${TOKEN_DOT_STYLES[item.key]}`}
                      />
                      <span className="font-medium text-ink">{item.key}</span>
                      <span className="text-ink-light/60">:</span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-ink-light/40 font-medium">
                        filter
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${TOKEN_DOT_STYLES[item.key]}`}
                      />
                      <span className="text-ink-light/60 text-xs shrink-0">
                        {item.key}:
                      </span>
                      <span className="font-medium text-ink">{item.value}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
