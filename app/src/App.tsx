import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactCardFlip from "react-card-flip";
import { api } from "./lib/api/client";
import type { components } from "./lib/api/v1";

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
  );
}
function Instructions({ recipe }: { recipe: Recipe }) {
  const instructions = [...(recipe.instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number,
  );

  return (
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
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full max-w-3xl cursor-pointer"
      style={{ aspectRatio: "5 / 3" }}
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
          <Ingredients recipe={recipe} />
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
          <Instructions recipe={recipe} />
        </div>
      </ReactCardFlip>
    </div>
  );
}

const Index = ({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) => {
  const [recipes, setRecipes] = useState<readonly Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"mine" | "all">("mine");

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
    fetchRecipes("", view === "mine");
  }, [fetchRecipes, view]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchRecipes(debouncedSearch, view === "mine");
  }, [debouncedSearch, fetchRecipes, view]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink-light text-lg">Loading recipes...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <p className="text-ink-light text-lg mb-4">
          No recipes found. Try adjusting your search or adding a new recipe.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 items-center min-h-screen p-8 overflow-y-auto gap-y-2">
      {recipes.map((r) => (
        <RecipeCard recipe={r} key={r.id} />
      ))}
    </div>
  );
};

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

  return <Index token={token} onLogout={handleLogout} />;
}
