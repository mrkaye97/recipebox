import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "./lib/api/client";
import type { components } from "./lib/api/v1";

type Recipe = components["schemas"]["src__schemas__Recipe"];
type Ingredient = components["schemas"]["RecipeIngredient"];
type Instruction = components["schemas"]["RecipeInstruction"];

// ── Auth helpers ──

function getStoredToken(): string | null {
  return localStorage.getItem("recipebox_token");
}

function storeToken(token: string) {
  localStorage.setItem("recipebox_token", token);
}

function clearToken() {
  localStorage.removeItem("recipebox_token");
}

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

// ── Auth Screen ──

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
        body: {
          email,
          name,
          password,
          privacy_preference: "private",
        },
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
        className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-sm"
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
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
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

// ── Recipe Card (pulled out, flippable) ──

function RecipeCard({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  const ingredients = recipe.ingredients ?? [];
  const instructions = [...(recipe.instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number,
  );

  const formatQuantity = (ing: Ingredient) => {
    const qty = ing.quantity ? `${ing.quantity}` : "";
    const unit = ing.units || "";
    return [qty, unit].filter(Boolean).join(" ");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />

      <div
        className={`relative w-full max-w-lg aspect-[4/5] max-h-[85vh] ${closing ? "animate-put-back" : "animate-pull-out"}`}
        style={{ perspective: "1200px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`card-inner cursor-pointer ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
        >
          {/* Front: Ingredients */}
          <div className="card-face bg-card rounded-2xl shadow-2xl border border-cream-dark overflow-hidden flex flex-col">
            <div className="bg-accent/90 px-6 py-4">
              <h2 className="font-display text-2xl font-bold text-white leading-tight">
                {recipe.name}
              </h2>
              <p className="text-white/80 text-sm font-body mt-1">
                {recipe.author}
                {recipe.cuisine ? ` \u00b7 ${recipe.cuisine}` : ""}
                {recipe.time_estimate_minutes
                  ? ` \u00b7 ${recipe.time_estimate_minutes} min`
                  : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 lined">
              <h3 className="font-display text-lg font-semibold mb-3 text-ink">
                Ingredients
              </h3>
              <ul className="space-y-2">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-2 text-ink font-body">
                    <span className="text-cardboard-dark font-medium shrink-0">
                      {formatQuantity(ing)}
                    </span>
                    <span>{ing.name}</span>
                  </li>
                ))}
                {ingredients.length === 0 && (
                  <li className="text-ink-light/60 italic">
                    No ingredients listed
                  </li>
                )}
              </ul>
              {recipe.notes && (
                <div className="mt-6 pt-4 border-t border-cream-dark">
                  <p className="text-sm text-ink-light italic">
                    {recipe.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 text-center text-ink-light/50 text-xs font-body border-t border-cream-dark">
              tap to flip for instructions
            </div>
          </div>

          {/* Back: Instructions */}
          <div className="card-face card-back bg-card rounded-2xl shadow-2xl border border-cream-dark overflow-hidden flex flex-col">
            <div className="bg-cardboard-dark px-6 py-4">
              <h2 className="font-display text-2xl font-bold text-white leading-tight">
                {recipe.name}
              </h2>
              <p className="text-white/80 text-sm font-body mt-1">
                Instructions
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 lined">
              <ol className="space-y-4">
                {instructions.map((step: Instruction) => (
                  <li key={step.step_number} className="flex gap-3 font-body">
                    <span className="font-display text-lg font-bold text-cardboard-dark shrink-0 w-7 text-right">
                      {step.step_number}.
                    </span>
                    <span className="text-ink leading-relaxed pt-0.5">
                      {step.content}
                    </span>
                  </li>
                ))}
                {instructions.length === 0 && (
                  <li className="text-ink-light/60 italic">
                    No instructions listed
                  </li>
                )}
              </ol>
            </div>
            <div className="px-6 py-3 text-center text-ink-light/50 text-xs font-body border-t border-cream-dark">
              tap to flip for ingredients
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── The Recipe Box ──

function RecipeBox({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [recipes, setRecipes] = useState<readonly Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchRecipes = useCallback(
    async (searchQuery: string) => {
      const { data } = await api.GET("/recipes", {
        headers: authHeaders,
        params: {
          query: {
            search: searchQuery || undefined,
            only_user: true,
          },
        },
      });
      if (data) setRecipes(data);
      setLoading(false);
    },
    [authHeaders],
  );

  useEffect(() => {
    fetchRecipes("");
  }, [fetchRecipes]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchRecipes(debouncedSearch);
  }, [debouncedSearch, fetchRecipes]);

  const typeLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  const grouped = useMemo(() => {
    const temp: Record<string, Recipe[]> = {};
    for (const r of recipes) {
      const key = typeLabel(r.type);
      if (!temp[key]) temp[key] = [];
      temp[key].push(r);
    }
    for (const key of Object.keys(temp)) {
      temp[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return temp as Record<string, readonly Recipe[]>;
  }, [recipes]);

  const groupOrder = [
    "Main",
    "Starter",
    "Salad",
    "Dessert",
    "Snack",
    "Cocktail",
    "Condiment",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-xl mb-6 flex items-end justify-between">
        <h1 className="font-display text-4xl font-bold text-ink">
          Recipe Box
        </h1>
        <button
          onClick={onLogout}
          className="text-sm text-ink-light hover:text-accent transition-colors font-body cursor-pointer"
        >
          Sign out
        </button>
      </div>

      {/* Search */}
      <div className="w-full max-w-xl mb-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-dark bg-card text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-cardboard font-body shadow-sm"
          />
        </div>
      </div>

      {/* The Box */}
      <div className="w-full max-w-xl">
        <div className="bg-gradient-to-b from-cardboard to-cardboard-dark rounded-t-2xl px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 text-white/80 text-xs font-body">
            <span>
              {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="bg-cream-dark rounded-b-2xl border-x-2 border-b-2 border-cardboard/40 shadow-lg">
          <div className="card-scroll overflow-y-auto max-h-[60vh] p-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-cardboard border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-16 text-ink-light/50 font-body">
                {search ? "No recipes match your search" : "Your box is empty"}
              </div>
            ) : (
              <div className="space-y-1">
                {groupOrder
                  .filter((g) => grouped[g])
                  .map((group) => (
                    <div key={group}>
                      {/* Divider tab */}
                      <div className="sticky top-0 z-10 bg-tab/95 backdrop-blur-sm rounded-lg px-4 py-1.5 mb-1 shadow-sm">
                        <span className="font-display text-sm font-semibold text-ink-light">
                          {group}
                        </span>
                      </div>
                      {/* Cards in this group */}
                      {grouped[group].map((recipe) => (
                        <button
                          key={recipe.id}
                          onClick={() => setSelectedRecipe(recipe)}
                          className="w-full text-left px-4 py-3 rounded-lg bg-card hover:bg-card/80 border border-transparent hover:border-cardboard/30 transition-all duration-150 flex items-center gap-3 group cursor-pointer mb-0.5"
                        >
                          <div className="w-1 h-8 rounded-full bg-cardboard/40 group-hover:bg-accent/60 transition-colors shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-body font-medium text-ink truncate">
                              {recipe.name}
                            </p>
                            <p className="text-xs text-ink-light/60 font-body truncate">
                              {recipe.author}
                              {recipe.cuisine
                                ? ` \u00b7 ${recipe.cuisine}`
                                : ""}
                              {recipe.time_estimate_minutes
                                ? ` \u00b7 ${recipe.time_estimate_minutes}m`
                                : ""}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 text-ink-light/30 group-hover:text-cardboard-dark transition-colors shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              d="M5 12h14M12 5l7 7-7 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        {/* Box shadow / base */}
        <div className="h-2 mx-4 bg-cardboard-dark/20 rounded-b-xl" />
      </div>

      {/* Pulled-out card */}
      {selectedRecipe && (
        <RecipeCard
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}

// ── App Shell ──

export function App() {
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

  return <RecipeBox token={token} onLogout={handleLogout} />;
}
