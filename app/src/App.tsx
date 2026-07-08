import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactCardFlip from "react-card-flip";
import { AddRecipeModal } from "./AddRecipeModal";
import { SearchBar } from "./SearchBar";
import { api } from "./lib/api/client";
import type { components } from "./lib/api/v1";
import {
  clearToken,
  getStoredToken,
  isTokenExpired,
  storeToken,
  useAuth,
} from "./lib/auth";

type Recipe = components["schemas"]["src__schemas__Recipe"];
type Ingredient = components["schemas"]["RecipeIngredient"];
type Instruction = components["schemas"]["RecipeInstruction"];
type Meal = components["schemas"]["Meal"];
type RecipeType = components["schemas"]["RecipeType"];

function AuthScreen({ onAuth }: { onAuth: (token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const { data, error: apiError } = await api.POST("/auth/login", {
        body: { username: email, password, scope: "read write" },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        bodySerializer: (body) => {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(
            body as Record<string, unknown>,
          )) {
            if (v != null) params.set(k, String(v));
          }
          return params.toString();
        },
      });

      setLoading(false);
      if (apiError || !data) {
        setError("Invalid email or password");
        return;
      }
      storeToken(data.access_token);
      onAuth(data.access_token);
    } else {
      const { data, error: apiError } = await api.POST("/auth/register", {
        body: { email, name, password, privacy_preference: "private" },
      });

      setLoading(false);
      if (apiError || !data) {
        setError("Registration failed");
        return;
      }
      storeToken(data.access_token);
      onAuth(data.access_token);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-cream-dark bg-cream text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-cardboard mb-3 font-body";

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl shadow-sm p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-3xl font-bold text-center mb-6 text-ink">
          Recipe Box
        </h1>
        {error && (
          <p className="text-accent text-sm text-center mb-4">{error}</p>
        )}
        {mode === "register" && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 rounded-lg bg-cardboard text-white font-body font-semibold hover:bg-cardboard-dark transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
        <p className="text-center text-sm text-ink-light mt-4 font-body">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="text-cardboard-dark hover:text-accent font-medium cursor-pointer"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

function Ingredients({ recipe }: { recipe: Recipe }) {
  const ingredients = recipe.ingredients ?? [];

  const formatQuantity = (ing: Ingredient) => {
    const qty = ing.quantity ? `${ing.quantity}` : "";
    const unit = ing.units || "";
    return [qty, unit].filter(Boolean).join(" ");
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto py-4 pr-6 lined-card cramped-content sm:overflow-hidden">
      <h3 className="handwritten text-xl font-semibold text-ink-blue mb-2 underline decoration-card-margin/40 col-span-all">
        Ingredients
      </h3>
      <ul>
        {ingredients.map((ing, i) => (
          <li key={i} className="ingredient-line handwritten text-lg text-ink">
            {formatQuantity(ing) && (
              <span className="text-ink-blue font-semibold">
                {formatQuantity(ing)}{" "}
              </span>
            )}
            <span>{ing.name}</span>
          </li>
        ))}
        {ingredients.length === 0 && (
          <li className="ingredient-line handwritten text-base text-ink-light/60 italic">
            No ingredients listed
          </li>
        )}
      </ul>
      {recipe.notes && (
        <div className="mt-3 pt-2 border-t border-card-margin/30 break-inside-avoid">
          <p className="handwritten text-base text-ink-light italic">
            * {recipe.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function Instructions({ recipe }: { recipe: Recipe }) {
  const instructions = [...(recipe.instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number,
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto py-4 pr-6 lined-card cramped-content sm:overflow-hidden">
      <ol className="space-y-1.5">
        {instructions.map((step: Instruction) => (
          <li
            key={step.step_number}
            className="handwritten text-base text-ink flex gap-1.5 break-inside-avoid"
          >
            <span className="text-ink-blue font-bold shrink-0">
              {step.step_number}.
            </span>
            <span className="leading-snug">{step.content}</span>
          </li>
        ))}
        {instructions.length === 0 && (
          <li className="handwritten text-ink-light/60 text-base italic">
            No instructions listed
          </li>
        )}
      </ol>
    </div>
  );
}

function formatLastMade(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return then.toLocaleDateString();
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { authHeaders, userId } = useAuth();
  const queryClient = useQueryClient();
  const isMine = recipe.user_id === userId;

  const cook = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/activity", {
        headers: authHeaders,
        body: { recipe_id: recipe.id },
      });
      if (error) throw new Error("Could not mark as cooked");
      return data;
    },
    onSuccess: (data) => {
      // Patch last_made_at in place so the list keeps its current order
      // instead of re-sorting after a refetch.
      const lastMadeAt = data?.last_made_at ?? new Date().toISOString();
      queryClient.setQueriesData<Recipe[]>({ queryKey: ["recipes"] }, (old) =>
        old?.map((r) =>
          r.id === recipe.id ? { ...r, last_made_at: lastMadeAt } : r,
        ),
      );
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await api.DELETE("/recipes/{id}", {
        headers: authHeaders,
        params: { path: { id: recipe.id } },
      });
      if (error) throw new Error("Could not delete recipe");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const addToBox = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/recipes/download/{recipe_id}", {
        headers: authHeaders,
        params: { path: { recipe_id: recipe.id } },
      });
      if (error) throw new Error("Could not add recipe to your box");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const actionBar = (
    <div
      className="flex flex-wrap items-center gap-2 px-5 pb-4 pt-1 sm:px-6"
      onClick={stop}
    >
      {isMine ? (
        <>
          <button
            onClick={() => cook.mutate()}
            disabled={cook.isPending}
            className="rounded-md bg-cardboard px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-cardboard-dark disabled:opacity-50"
          >
            {cook.isPending ? "Saving..." : "I cooked this"}
          </button>
          {recipe.last_made_at && (
            <span className="text-sm text-ink-light italic">
              Last made {formatLastMade(recipe.last_made_at)}
            </span>
          )}
          <button
            onClick={() => {
              if (window.confirm(`Delete "${recipe.name}" from your box?`)) {
                remove.mutate();
              }
            }}
            disabled={remove.isPending}
            className="ml-auto rounded-md border border-card-margin/40 px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Delete
          </button>
        </>
      ) : (
        <button
          onClick={() => addToBox.mutate()}
          disabled={addToBox.isPending || addToBox.isSuccess}
          className="rounded-md bg-cardboard px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-cardboard-dark disabled:opacity-50"
        >
          {addToBox.isSuccess
            ? "Added to your box"
            : addToBox.isPending
              ? "Adding..."
              : "Add to my box"}
        </button>
      )}
    </div>
  );

  return (
    <div
      className="h-full w-full cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setIsFlipped(!isFlipped);
      }}
    >
      <ReactCardFlip
        isFlipped={isFlipped}
        flipDirection="horizontal"
        flipSpeedFrontToBack={0.8}
        flipSpeedBackToFront={0.8}
        containerStyle={{ height: "100%" }}
      >
        <div className="index-card overflow-hidden flex flex-col h-full">
          <div className="card-header-line px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
            <h2 className="handwritten text-2xl font-bold text-ink leading-tight sm:text-3xl">
              {recipe.name}
            </h2>
            <p className="handwritten text-base text-ink-light mt-0.5 sm:text-lg">
              {recipe.author}
              {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
              {recipe.time_estimate_minutes
                ? ` · ${recipe.time_estimate_minutes} min`
                : ""}
            </p>
          </div>
          <Ingredients recipe={recipe} />
          {actionBar}
        </div>

        <div className="index-card overflow-hidden flex flex-col h-full">
          <div className="card-header-line px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
            <h2 className="handwritten text-2xl font-bold text-ink leading-tight sm:text-3xl">
              {recipe.name}
            </h2>
            <p className="handwritten text-base text-ink-light mt-0.5 sm:text-lg">
              Instructions
            </p>
          </div>
          <Instructions recipe={recipe} />
          {actionBar}
        </div>
      </ReactCardFlip>
    </div>
  );
}

const STACK_LAYERS = [
  "translate(-14px, 20px) rotate(-4.5deg)",
  "translate(18px, 16px) rotate(3.8deg)",
  "translate(-9px, 12px) rotate(2.2deg)",
  "translate(10px, 8px) rotate(-2.4deg)",
  "translate(-3px, 5px) rotate(1.2deg)",
];

function CardBrowser({ recipes }: { recipes: readonly Recipe[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  // The card we're navigating away from. It stays mounted just long enough to
  // animate off-screen while the new card slides in, then clears itself.
  const [exiting, setExiting] = useState<{
    recipe: Recipe;
    dir: 1 | -1;
    id: number;
  } | null>(null);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, recipes.length - 1)));
  }, [recipes.length]);

  const go = useCallback(
    (delta: number) => {
      const from = Math.min(index, recipes.length - 1);
      const next = from + delta;
      if (next < 0 || next >= recipes.length) return;
      setDir(delta > 0 ? 1 : -1);
      setExiting({ recipe: recipes[from], dir: delta > 0 ? 1 : -1, id: from });
      setIndex(next);
    },
    [index, recipes],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const safeIndex = Math.min(index, recipes.length - 1);
  const recipe = recipes[safeIndex];
  const atStart = safeIndex === 0;
  const atEnd = safeIndex === recipes.length - 1;

  const arrowClass =
    "h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cardboard/40 bg-card text-2xl text-ink transition-colors hover:border-cardboard hover:bg-cream-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-cardboard/40 disabled:hover:bg-card";

  return (
    <div className="flex h-full flex-col items-center gap-4 px-3 sm:justify-center sm:gap-6 sm:px-4">
      <div className="flex w-full min-h-0 flex-1 items-stretch justify-center gap-4 sm:flex-none sm:items-center sm:gap-8">
        <button
          type="button"
          aria-label="First recipe"
          onClick={() => go(-safeIndex)}
          disabled={atStart}
          className={`hidden sm:flex ${arrowClass}`}
        >
          ‹‹
        </button>
        <button
          type="button"
          aria-label="Previous recipe"
          onClick={() => go(-1)}
          disabled={atStart}
          className={`hidden sm:flex ${arrowClass}`}
        >
          ‹
        </button>

        <div className="relative h-full w-full max-w-3xl sm:h-auto sm:aspect-[5/3]">
          {STACK_LAYERS.slice(
            0,
            Math.min(STACK_LAYERS.length, recipes.length - 1),
          ).map((layer, i) => (
            <div
              key={i}
              className="index-card"
              style={{ position: "absolute", inset: 0, transform: layer }}
            />
          ))}
          {exiting && exiting.id !== safeIndex && (
            <div
              key={`exit-${exiting.id}`}
              className={`absolute inset-0 ${
                exiting.dir > 0 ? "slide-out-left" : "slide-out-right"
              }`}
              onAnimationEnd={() => setExiting(null)}
            >
              <RecipeCard recipe={exiting.recipe} />
            </div>
          )}
          <div
            key={safeIndex}
            className={`absolute inset-0 z-10 ${
              dir > 0 ? "slide-in-right" : "slide-in-left"
            }`}
          >
            <RecipeCard recipe={recipe} />
          </div>
        </div>

        <button
          type="button"
          aria-label="Next recipe"
          onClick={() => go(1)}
          disabled={atEnd}
          className={`hidden sm:flex ${arrowClass}`}
        >
          ›
        </button>
        <button
          type="button"
          aria-label="Last recipe"
          onClick={() => go(recipes.length - 1 - safeIndex)}
          disabled={atEnd}
          className={`hidden sm:flex ${arrowClass}`}
        >
          ››
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* On mobile the side arrows are hidden to give the card full width, so
            navigation lives in a dedicated row below the card. */}
        <div className="flex items-center gap-6 sm:hidden">
          <button
            type="button"
            aria-label="Previous recipe"
            onClick={() => go(-1)}
            disabled={atStart}
            className={`flex ${arrowClass}`}
          >
            ‹
          </button>
          <p className="font-body text-sm font-medium text-ink-light tabular-nums">
            {safeIndex + 1} / {recipes.length}
          </p>
          <button
            type="button"
            aria-label="Next recipe"
            onClick={() => go(1)}
            disabled={atEnd}
            className={`flex ${arrowClass}`}
          >
            ›
          </button>
        </div>
        <p className="hidden font-body text-sm font-medium text-ink-light sm:block">
          {safeIndex + 1} / {recipes.length}
        </p>
        <p className="hidden font-body text-xs text-ink-light/60 sm:block">
          Use ← → to browse
        </p>
      </div>
    </div>
  );
}

type ParsedSearch = {
  search?: string;
  cuisine?: string;
  meal?: Meal;
  type?: RecipeType;
};

const parseSearch = (search: string): ParsedSearch => {
  const result: ParsedSearch = {};
  const regex = /(\w+):([^\s]+)/g;
  let match;
  while ((match = regex.exec(search)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2].toLowerCase();
    if (key === "cuisine") result.cuisine = value;
    else if (key === "meal") result.meal = value as Meal;
    else if (key === "type") result.type = value as RecipeType;
  }

  const cleanedSearch = search.replace(regex, "").trim();
  if (cleanedSearch) result.search = cleanedSearch;

  return result;
};

const Recipes = ({
  search,
  view,
  onFetchingChange,
}: {
  search: string | undefined;
  view: "mine" | "all";
  onFetchingChange: (isFetching: boolean) => void;
}) => {
  const { authHeaders } = useAuth();
  const parsedSearch = useMemo(() => parseSearch(search ?? ""), [search]);

  const { isLoading, isFetching, data, isError } = useQuery({
    queryKey: ["recipes", { search, view }],
    queryFn: async () => {
      const { data } = await api.GET("/recipes", {
        headers: authHeaders,
        params: {
          query: {
            search: parsedSearch.search,
            only_user: view === "mine",
            type: parsedSearch.type,
            meal: parsedSearch.meal,
            cuisine: parsedSearch.cuisine,
          },
        },
      });

      return data;
    },
    enabled: !!authHeaders,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const recipes = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    onFetchingChange(isFetching);

    return () => onFetchingChange(false);
  }, [isFetching, onFetchingChange]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-6">
        <p className="text-ink-light text-lg">Loading recipes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-6">
        <p className="text-accent text-lg">
          An error occurred while fetching recipes. Please try again later.
        </p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 py-6">
        <p className="text-ink-light text-lg">
          No recipes found for the current filters.
        </p>
      </div>
    );
  }

  return <CardBrowser key={`${search}:${view}`} recipes={recipes} />;
};

const Index = ({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) => {
  const { authHeaders } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"mine" | "all">("mine");
  const [isUpdatingRecipes, setIsUpdatingRecipes] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const { data } = await api.GET("/recipes/filter-options", {
        headers: authHeaders,
      });
      return data;
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-cream">
      <div className="relative flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-2 border-cardboard/40 px-4 py-4 sm:gap-4 sm:px-8 sm:py-6">
        <SearchBar onChange={setSearch} cuisines={filterOptions?.cuisines} />
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              id="toggleView"
              name="toggleView"
              value="Show All"
              checked={view === "all"}
              onChange={() => setView(view === "all" ? "mine" : "all")}
              className="h-4 w-4 rounded border-ink/40 accent-cardboard"
            />
            <span>Show all recipes</span>
          </label>

          <button
            onClick={() => setShowAdd(true)}
            className="ml-auto rounded-lg bg-cardboard px-4 py-2 font-body font-semibold text-white transition-colors hover:bg-cardboard-dark sm:ml-0"
          >
            + Add recipe
          </button>

          <button
            onClick={onLogout}
            className="rounded-lg border-2 border-cardboard/40 bg-card px-4 py-2 font-body font-medium text-ink transition-colors hover:border-cardboard"
          >
            Log Out
          </button>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden">
          {isUpdatingRecipes && (
            <div className="header-progress-bar h-full w-full" />
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 py-3 sm:py-6">
        <Recipes
          search={debouncedSearch}
          view={view}
          onFetchingChange={setIsUpdatingRecipes}
        />
      </div>

      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

function InnerApp() {
  const [token, setToken] = useState<string | null>(() => {
    const t = getStoredToken();
    if (t && !isTokenExpired(t)) return t;
    clearToken();
    return null;
  });

  const handleLogout = () => {
    clearToken();
    setToken(null);
  };

  if (!token) {
    return <AuthScreen onAuth={setToken} />;
  }

  return <Index token={token} onLogout={handleLogout} />;
}

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
    </QueryClientProvider>
  );
}
