import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "./lib/api/client";
import { useAuth } from "./lib/auth";
import type { components } from "./lib/api/v1";

type DietaryRestriction = components["schemas"]["DietaryRestriction"];

type Tab = "online" | "cookbook" | "manual";

const DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  "gluten_free",
  "dairy_free",
  "nut_free",
  "vegan",
  "vegetarian",
  "pescatarian",
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-cardboard font-body";
const labelClass = "block text-sm font-medium text-ink mb-1 font-body";

function parseIngredients(raw: string) {
  // One ingredient per line: "2 cup flour" or just "flour"
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([\d.,/]+)\s*(\S+)?\s+(.*)$/);
      if (match && /[\d]/.test(match[1])) {
        return {
          quantity: parseFloat(match[1].replace(/,/g, "")) || 0,
          units: match[2] ?? "",
          name: match[3].trim() || line,
        };
      }
      return { quantity: 0, units: "", name: line };
    });
}

function parseInstructions(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .map((content, i) => ({ step_number: i + 1, content }));
}

export function AddRecipeModal({ onClose }: { onClose: () => void }) {
  const { authHeaders } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("online");
  const [error, setError] = useState("");

  // Online
  const [url, setUrl] = useState("");

  // Cookbook
  const [files, setFiles] = useState<FileList | null>(null);
  const [author, setAuthor] = useState("");
  const [cookbookName, setCookbookName] = useState("");
  const [pageNumber, setPageNumber] = useState("");

  // Manual
  const [name, setName] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [tags, setTags] = useState("");
  const [dietary, setDietary] = useState<DietaryRestriction[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // Shared
  const [notes, setNotes] = useState("");

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["recipes"] });
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (tab === "online") {
        const { data, error: apiError } = await api.POST("/recipes/online", {
          headers: authHeaders,
          body: { location: "online", url, notes: notes || null },
        });
        if (apiError || !data) throw new Error("Could not import recipe from that link");
        return data;
      }

      if (tab === "cookbook") {
        if (!files || files.length === 0) throw new Error("Please add at least one photo");
        const formData = new FormData();
        formData.set("location", "cookbook");
        formData.set("author", author);
        formData.set("cookbook_name", cookbookName);
        formData.set("page_number", pageNumber);
        if (notes) formData.set("notes", notes);
        for (const file of Array.from(files)) formData.append("files", file);

        const { data, error: apiError } = await api.POST("/recipes/cookbook", {
          headers: authHeaders,
          body: formData as never,
          bodySerializer: (body) => body as never,
        });
        if (apiError || !data) throw new Error("Could not read a recipe from that photo");
        return data;
      }

      const { data, error: apiError } = await api.POST("/recipes/made-up", {
        headers: authHeaders,
        body: {
          location: "made_up",
          name,
          author: manualAuthor,
          cuisine,
          time_estimate_minutes: parseInt(timeEstimate, 10) || 0,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          dietary_restrictions_met: dietary,
          ingredients: parseIngredients(ingredients),
          instructions: parseInstructions(instructions),
          notes: notes || null,
        },
      });
      if (apiError || !data) throw new Error("Could not save that recipe");
      return data;
    },
    onSuccess,
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  const toggleDietary = (dr: DietaryRestriction) => {
    setDietary((prev) =>
      prev.includes(dr) ? prev.filter((x) => x !== dr) : [...prev, dr],
    );
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "online", label: "Paste a link" },
    { id: "cookbook", label: "Photo" },
    { id: "manual", label: "Enter manually" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Add a recipe</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-light hover:text-accent text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-cream p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError("");
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-cardboard text-white"
                  : "text-ink-light hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-accent">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "online" && (
            <div>
              <label className={labelClass}>Recipe URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          )}

          {tab === "cookbook" && (
            <>
              <div>
                <label className={labelClass}>Photo(s) of the recipe</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cookbook name</label>
                <input
                  type="text"
                  value={cookbookName}
                  onChange={(e) => setCookbookName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Page number</label>
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </>
          )}

          {tab === "manual" && (
            <>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Author</label>
                  <input
                    type="text"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cuisine</label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Time estimate (minutes)</label>
                <input
                  type="number"
                  value={timeEstimate}
                  onChange={(e) => setTimeEstimate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="weeknight, comfort food"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Dietary restrictions met</label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_RESTRICTIONS.map((dr) => (
                    <button
                      key={dr}
                      type="button"
                      onClick={() => toggleDietary(dr)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        dietary.includes(dr)
                          ? "bg-cardboard text-white"
                          : "bg-cream text-ink-light hover:text-ink"
                      }`}
                    >
                      {dr.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Ingredients (one per line)</label>
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={4}
                  placeholder={"2 cup flour\n1 tsp salt"}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instructions (one step per line)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-cardboard py-3 font-body font-semibold text-white transition-colors hover:bg-cardboard-dark disabled:opacity-50"
          >
            {mutation.isPending ? "Adding..." : "Add to my box"}
          </button>
        </form>
      </div>
    </div>
  );
}
