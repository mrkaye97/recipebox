import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api/client";
import type { components } from "./lib/api/v1";
import ReactCardFlip from "./ReactCardFlip";
import { RecipeBox3D } from "./RecipeBox3D";

type Recipe = components["schemas"]["src__schemas__Recipe"];
type Ingredient = components["schemas"]["RecipeIngredient"];
type Instruction = components["schemas"]["RecipeInstruction"];

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
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ isolation: "isolate" }}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />

      <div
        className={`relative z-10 w-full max-w-3xl cursor-pointer ${closing ? "animate-put-back" : "animate-pull-out"}`}
        style={{ aspectRatio: "5 / 3", maxHeight: "min(80vh, 540px)" }}
        onClick={(e) => {
          e.stopPropagation();
          setFlipped(!flipped);
        }}
      >
        <ReactCardFlip
          isFlipped={flipped}
          flipDirection="horizontal"
          flipSpeedFrontToBack={0.6}
          flipSpeedBackToFront={0.6}
          containerStyle={{ height: "100%" }}
        >
          <div className="index-card overflow-hidden flex flex-col h-full">
            <div className="card-header-line px-6 pt-5 pb-3">
              <h2 className="handwritten text-3xl font-bold text-ink leading-tight">
                {recipe.name}
              </h2>
              <p className="handwritten text-lg text-ink-light mt-0.5">
                {recipe.author}
                {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
                {recipe.time_estimate_minutes
                  ? ` · ${recipe.time_estimate_minutes} min`
                  : ""}
              </p>
            </div>
            <div className="flex-1 overflow-hidden py-4 pr-6 lined-card cramped-content">
              <h3 className="handwritten text-xl font-semibold text-ink-blue mb-2 underline decoration-card-margin/40 col-span-all">
                Ingredients
              </h3>
              <ul className="space-y-0.5">
                {ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="handwritten text-base text-ink flex gap-1.5 break-inside-avoid"
                  >
                    <span className="text-ink-blue font-semibold shrink-0">
                      {formatQuantity(ing)}
                    </span>
                    <span>{ing.name}</span>
                  </li>
                ))}
                {ingredients.length === 0 && (
                  <li className="handwritten text-ink-light/60 text-base italic">
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
          </div>

          <div className="index-card overflow-hidden flex flex-col h-full">
            <div className="card-header-line px-6 pt-5 pb-3">
              <h2 className="handwritten text-3xl font-bold text-ink leading-tight">
                {recipe.name}
              </h2>
              <p className="handwritten text-lg text-ink-light mt-0.5">
                Instructions
              </p>
            </div>
            <div className="flex-1 overflow-hidden py-4 pr-6 lined-card cramped-content">
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
          </div>
        </ReactCardFlip>
      </div>
    </div>
  );
}

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
  const [view, setView] = useState<"box" | "browse">("box");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchRecipes = useCallback(
    async (searchQuery: string, onlyUser: boolean) => {
      const { data } = await api.GET("/recipes", {
        headers: authHeaders,
        params: {
          query: {
            search: searchQuery || undefined,
            only_user: onlyUser,
          },
        },
      });
      if (data) setRecipes(data);
      setLoading(false);
    },
    [authHeaders],
  );

  useEffect(() => {
    setLoading(true);
    setRecipes([]);
    setSearch("");
    setDebouncedSearch("");
    fetchRecipes("", view === "box");
  }, [fetchRecipes, view]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchRecipes(debouncedSearch, view === "box");
  }, [debouncedSearch, fetchRecipes, view]);

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-3xl mb-4 flex items-end justify-between">
          <h1 className="handwritten text-5xl font-bold text-ink">
            Recipe Box
          </h1>
          <button
            onClick={onLogout}
            className="text-sm text-ink-light hover:text-accent transition-colors font-body cursor-pointer"
          >
            Sign out
          </button>
        </div>

        <div className="w-full max-w-3xl mb-3 flex gap-1 bg-cream-dark rounded-xl p-1">
          <button
            onClick={() => setView("box")}
            className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all cursor-pointer ${
              view === "box"
                ? "bg-card text-ink shadow-sm"
                : "text-ink-light hover:text-ink"
            }`}
          >
            My Box
          </button>
          <button
            onClick={() => setView("browse")}
            className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all cursor-pointer ${
              view === "browse"
                ? "bg-card text-ink shadow-sm"
                : "text-ink-light hover:text-ink"
            }`}
          >
            Browse
          </button>
        </div>

        <div className="w-full max-w-3xl mb-4">
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

        <RecipeBox3D
          recipes={recipes}
          loading={loading}
          search={search}
          view={view}
          onSelectRecipe={setSelectedRecipe}
        />
      </div>

      {selectedRecipe && (
        <RecipeCard
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}

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
